from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.menu import Category, MenuItem
from app.schemas.menu import CategoryCreate, CategoryUpdate, MenuItemCreate, MenuItemUpdate

class MenuService:

    @staticmethod
    def _evaluate_item_schedule(item: MenuItem) -> MenuItem:
        """Evaluates time and day schedule to update dynamic availability."""
        now = datetime.now()
        current_day = now.strftime("%A").upper() # e.g. "MONDAY"
        current_time_str = now.strftime("%H:%M") # e.g. "09:30"

        # 1. Day of week check
        if item.available_days and len(item.available_days) > 0:
            upper_days = [d.upper() for d in item.available_days]
            if current_day not in upper_days:
                item.is_available = False
                return item

        # 2. Time range check
        if item.available_start_time and item.available_end_time:
            if not (item.available_start_time <= current_time_str <= item.available_end_time):
                item.is_available = False

        return item

    # Category CRUD
    @staticmethod
    async def get_categories(db: AsyncSession, active_only: bool = False) -> List[Category]:
        stmt = select(Category).order_by(Category.display_order.asc(), Category.name.asc())
        if active_only:
            stmt = stmt.where(Category.is_active == True)
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def create_category(db: AsyncSession, cat_in: CategoryCreate) -> Category:
        category = Category(**cat_in.model_dump())
        db.add(category)
        await db.commit()
        await db.refresh(category)
        return category

    @staticmethod
    async def update_category(db: AsyncSession, category_id: str, cat_in: CategoryUpdate) -> Category:
        stmt = select(Category).where(Category.id == category_id)
        res = await db.execute(stmt)
        category = res.scalar_one_or_none()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        for key, val in cat_in.model_dump(exclude_unset=True).items():
            setattr(category, key, val)

        await db.commit()
        await db.refresh(category)
        return category

    # Menu Item CRUD
    @staticmethod
    async def get_menu_items(
        db: AsyncSession,
        category_id: Optional[str] = None,
        search: Optional[str] = None,
        available_only: bool = False,
        todays_special_only: bool = False
    ) -> List[MenuItem]:
        stmt = select(MenuItem).options(selectinload(MenuItem.category)).order_by(MenuItem.name.asc())

        if category_id:
            stmt = stmt.where(MenuItem.category_id == category_id)
        if search:
            stmt = stmt.where(MenuItem.name.ilike(f"%{search}%"))
        if todays_special_only:
            stmt = stmt.where(MenuItem.is_todays_special == True)

        res = await db.execute(stmt)
        items = res.scalars().all()

        # Evaluate day & time schedule for each item
        processed_items = [MenuService._evaluate_item_schedule(item) for item in items]

        if available_only:
            processed_items = [item for item in processed_items if item.is_available]

        return processed_items

    @staticmethod
    async def create_menu_item(db: AsyncSession, item_in: MenuItemCreate) -> MenuItem:
        menu_item = MenuItem(**item_in.model_dump())
        db.add(menu_item)
        await db.commit()
        await db.refresh(menu_item)
        return menu_item

    @staticmethod
    async def update_menu_item(db: AsyncSession, item_id: str, item_in: MenuItemUpdate) -> MenuItem:
        stmt = select(MenuItem).options(selectinload(MenuItem.category)).where(MenuItem.id == item_id)
        res = await db.execute(stmt)
        menu_item = res.scalar_one_or_none()
        if not menu_item:
            raise HTTPException(status_code=404, detail="Menu item not found")

        for key, val in item_in.model_dump(exclude_unset=True).items():
            setattr(menu_item, key, val)

        await db.commit()
        await db.refresh(menu_item)
        return menu_item

    @staticmethod
    async def toggle_availability(db: AsyncSession, item_id: str) -> MenuItem:
        stmt = select(MenuItem).where(MenuItem.id == item_id)
        res = await db.execute(stmt)
        menu_item = res.scalar_one_or_none()
        if not menu_item:
            raise HTTPException(status_code=404, detail="Menu item not found")

        menu_item.is_available = not menu_item.is_available
        await db.commit()
        await db.refresh(menu_item)
        return menu_item

    @staticmethod
    async def delete_menu_item(db: AsyncSession, item_id: str) -> bool:
        stmt = select(MenuItem).where(MenuItem.id == item_id)
        res = await db.execute(stmt)
        menu_item = res.scalar_one_or_none()
        if not menu_item:
            raise HTTPException(status_code=404, detail="Menu item not found")

        await db.delete(menu_item)
        await db.commit()
        return True
