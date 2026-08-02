from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role, get_current_user
from app.models.user import User
from app.schemas.menu import CategoryRead, CategoryCreate, CategoryUpdate
from app.services.menu_service import MenuService
from app.api.v1.menu import verify_menu_edit_permission

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryRead])
async def list_categories(
    active_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    return await MenuService.get_categories(db, active_only=active_only)

@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    cat_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_menu_edit_permission)
):
    return await MenuService.create_category(db, cat_in)

@router.put("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: str,
    cat_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_menu_edit_permission)
):
    return await MenuService.update_category(db, category_id, cat_in)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_menu_edit_permission)
):
    await MenuService.delete_category(db, category_id)
    return None
