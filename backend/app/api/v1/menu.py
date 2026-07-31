from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.schemas.menu import MenuItemRead, MenuItemCreate, MenuItemUpdate
from app.services.menu_service import MenuService
from app.services.setting_service import SettingService

router = APIRouter(prefix="/menu", tags=["Menu Items"])

async def verify_menu_edit_permission(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role.name == "ADMIN":
        return current_user
    
    # Check cashier permissions setting
    config = await SettingService.get_system_config_summary(db)
    if not config.cashier_can_edit_menu:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cashiers are not allowed to edit the menu. Only owners can manage the menu."
        )
    return current_user

@router.get("", response_model=List[MenuItemRead])
async def list_menu_items(
    category_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    available_only: bool = Query(False),
    todays_special_only: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    return await MenuService.get_menu_items(
        db,
        category_id=category_id,
        search=search,
        available_only=available_only,
        todays_special_only=todays_special_only
    )

@router.post("", response_model=MenuItemRead, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    item_in: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_menu_edit_permission)
):
    return await MenuService.create_menu_item(db, item_in)

@router.put("/{item_id}", response_model=MenuItemRead)
async def update_menu_item(
    item_id: str,
    item_in: MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_menu_edit_permission)
):
    return await MenuService.update_menu_item(db, item_id, item_in)

@router.patch("/{item_id}/toggle-availability", response_model=MenuItemRead)
async def toggle_item_availability(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_menu_edit_permission)
):
    return await MenuService.toggle_availability(db, item_id)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_menu_edit_permission)
):
    await MenuService.delete_menu_item(db, item_id)
    return None
