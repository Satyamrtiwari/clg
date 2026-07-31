from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role, get_current_user
from app.models.user import User
from app.schemas.menu import CategoryRead, CategoryCreate, CategoryUpdate
from app.services.menu_service import MenuService

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryRead])
async def list_categories(
    active_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    return await MenuService.get_all_categories(db, active_only=active_only)

@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    cat_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    return await MenuService.create_category(db, cat_in)

@router.put("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: str,
    cat_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    return await MenuService.update_category(db, category_id, cat_in)
