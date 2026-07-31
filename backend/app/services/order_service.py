from datetime import datetime, date, timezone
from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.order import Order, OrderItem, Payment, OrderStatus, PaymentStatus, PaymentMethod
from app.models.menu import MenuItem
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.utils.order_number import generate_daily_order_number
from app.core.ws_manager import ws_manager

class OrderService:
    @staticmethod
    async def create_order(db: AsyncSession, order_in: OrderCreate, cashier_id: Optional[str] = None) -> Order:
        # 1. Generate Daily Order Number
        daily_num = await generate_daily_order_number(db)
        
        # 2. Fetch Menu Items and Calculate Subtotal
        item_ids = [item.menu_item_id for item in order_in.items]
        stmt = select(MenuItem).where(MenuItem.id.in_(item_ids))
        res = await db.execute(stmt)
        menu_items_map = {item.id: item for item in res.scalars().all()}
        
        subtotal = 0.0
        order_items = []

        for item_in in order_in.items:
            menu_item = menu_items_map.get(item_in.menu_item_id)
            if not menu_item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Menu item with id '{item_in.menu_item_id}' not found."
                )
            if not menu_item.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Item '{menu_item.name}' is currently unavailable."
                )
            
            unit_price = float(menu_item.price)
            line_total = unit_price * item_in.quantity
            subtotal += line_total

            order_items.append(
                OrderItem(
                    menu_item_id=menu_item.id,
                    item_name=menu_item.name,
                    unit_price=unit_price,
                    quantity=item_in.quantity,
                    total_price=line_total,
                    notes=item_in.notes
                )
            )

        # 3. Calculate Tax & Total
        tax_amount = round(subtotal * 0.05, 2)
        total_amount = max(0.0, round(subtotal + tax_amount - order_in.discount_amount, 2))

        # 4. Create Order Entity
        today_date = datetime.now(timezone.utc).date()
        
        pm_val = order_in.payment_method
        if isinstance(pm_val, str):
            pm_val = PaymentMethod(pm_val)

        order = Order(
            daily_order_number=daily_num,
            order_date=today_date,
            customer_name=order_in.customer_name.strip(),
            status=OrderStatus.PREPARING,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=order_in.discount_amount,
            total_amount=total_amount,
            payment_status=PaymentStatus.PAID,
            payment_method=pm_val,
            cashier_id=cashier_id,
            items=order_items
        )

        db.add(order)
        await db.flush()

        # Add Payment Record
        payment = Payment(
            order_id=order.id,
            payment_method=pm_val,
            amount=total_amount,
            status=PaymentStatus.PAID
        )
        db.add(payment)
        await db.commit()
        await db.refresh(order)

        status_str = order.status.value if hasattr(order.status, 'value') else str(order.status)

        # 5. Broadcast WebSocket Event to Display & Cashier terminals
        ws_event = {
            "event": "ORDER_CREATED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "id": order.id,
                "daily_order_number": order.daily_order_number,
                "customer_name": order.customer_name,
                "status": status_str,
                "created_at": order.created_at.isoformat(),
                "items_count": len(order.items),
                "total_amount": float(order.total_amount)
            }
        }
        await ws_manager.broadcast(ws_event, channel="all")

        return order

    @staticmethod
    async def update_order_status(db: AsyncSession, order_id: str, status_in: OrderStatusUpdate) -> Order:
        stmt = select(Order).where(Order.id == order_id)
        res = await db.execute(stmt)
        order = res.unique().scalar_one_or_none()

        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        st_val = status_in.status
        if isinstance(st_val, str):
            st_val = OrderStatus(st_val)

        order.status = st_val
        if st_val in [OrderStatus.READY, OrderStatus.COMPLETED]:
            order.completed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(order)

        status_str = order.status.value if hasattr(order.status, 'value') else str(order.status)

        # Broadcast update
        ws_event = {
            "event": "ORDER_UPDATED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "id": order.id,
                "daily_order_number": order.daily_order_number,
                "customer_name": order.customer_name,
                "status": status_str,
                "updated_at": order.updated_at.isoformat(),
                "items_count": len(order.items)
            }
        }
        await ws_manager.broadcast(ws_event, channel="all")

        return order

    @staticmethod
    async def get_active_orders_for_display(db: AsyncSession) -> List[Order]:
        today_date = datetime.now(timezone.utc).date()
        stmt = select(Order).where(
            Order.order_date == today_date,
            Order.status.in_([OrderStatus.PREPARING, OrderStatus.READY])
        ).order_by(Order.created_at.asc())
        res = await db.execute(stmt)
        return res.unique().scalars().all()

    @staticmethod
    async def get_orders(
        db: AsyncSession,
        target_date: Optional[date] = None,
        status_filter: Optional[OrderStatus] = None,
        search: Optional[str] = None
    ) -> List[Order]:
        stmt = select(Order)
        if target_date:
            stmt = stmt.where(Order.order_date == target_date)
        if status_filter:
            st_val = status_filter
            if isinstance(st_val, str):
                st_val = OrderStatus(st_val)
            stmt = stmt.where(Order.status == st_val)
        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(
                (Order.daily_order_number.like(search_pattern)) |
                (Order.customer_name.ilike(search_pattern))
            )
        
        stmt = stmt.order_by(desc(Order.created_at))
        res = await db.execute(stmt)
        return res.unique().scalars().all()
