from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import OrderStatus
from app.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await OrderService.create_order(db, order_in, cashier_id=current_user.id)

@router.patch("/{order_id}/status", response_model=OrderRead)
async def update_order_status(
    order_id: str,
    status_in: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await OrderService.update_order_status(db, order_id, status_in)

@router.get("/display", response_model=List[OrderRead])
async def get_display_orders(db: AsyncSession = Depends(get_db)):
    """Public endpoint for customer display TV screen"""
    return await OrderService.get_active_orders_for_display(db)

@router.get("", response_model=List[OrderRead])
async def list_orders(
    target_date: Optional[date] = Query(None),
    status_filter: Optional[OrderStatus] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await OrderService.get_orders(db, target_date=target_date, status_filter=status_filter, search=search)
