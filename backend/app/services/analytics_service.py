from datetime import datetime, date, timezone
from typing import Dict, List
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.schemas.analytics import AnalyticsDashboard, DailyStats, TopMenuItemStat, TopCategoryStat

class AnalyticsService:
    @staticmethod
    async def get_dashboard_analytics(db: AsyncSession) -> AnalyticsDashboard:
        today_date = datetime.now(timezone.utc).date()

        # 1. Fetch Today's Orders
        orders_stmt = select(Order).where(Order.order_date == today_date)
        res = await db.execute(orders_stmt)
        today_orders = res.scalars().all()

        today_orders_count = len(today_orders)
        active_orders_count = sum(1 for o in today_orders if o.status in [OrderStatus.PREPARING, OrderStatus.READY])
        completed_orders_count = sum(1 for o in today_orders if o.status == OrderStatus.COMPLETED)
        cancelled_orders_count = sum(1 for o in today_orders if o.status == OrderStatus.CANCELLED)
        
        today_revenue = sum(float(o.total_amount) for o in today_orders if o.payment_status == PaymentStatus.PAID and o.status != OrderStatus.CANCELLED)
        avg_order_value = (today_revenue / completed_orders_count) if completed_orders_count > 0 else 0.0

        stats = DailyStats(
            today_orders_count=today_orders_count,
            active_orders_count=active_orders_count,
            completed_orders_count=completed_orders_count,
            cancelled_orders_count=cancelled_orders_count,
            today_revenue=round(today_revenue, 2),
            avg_order_value=round(avg_order_value, 2)
        )

        # 2. Top Items Sold Today
        items_stmt = select(
            OrderItem.menu_item_id,
            OrderItem.item_name,
            func.sum(OrderItem.quantity).label("total_qty"),
            func.sum(OrderItem.total_price).label("total_rev")
        ).join(Order).where(
            Order.order_date == today_date,
            Order.status != OrderStatus.CANCELLED
        ).group_by(OrderItem.menu_item_id, OrderItem.item_name).order_by(desc("total_qty")).limit(5)

        items_res = await db.execute(items_stmt)
        top_items = [
            TopMenuItemStat(
                item_id=row.menu_item_id or "",
                item_name=row.item_name,
                quantity_sold=row.total_qty or 0,
                revenue=float(row.total_rev or 0.0)
            ) for row in items_res.all()
        ]

        # 3. Hourly Order Breakdown
        hourly_map: Dict[str, int] = {f"{h:02d}:00": 0 for h in range(8, 22)} # 8 AM to 10 PM
        for o in today_orders:
            hour_str = f"{o.created_at.hour:02d}:00"
            if hour_str in hourly_map:
                hourly_map[hour_str] += 1

        return AnalyticsDashboard(
            stats=stats,
            top_items=top_items,
            top_categories=[],
            hourly_orders=hourly_map
        )
