from pydantic import BaseModel
from typing import List, Dict, Any

class DailyStats(BaseModel):
    today_orders_count: int
    active_orders_count: int
    completed_orders_count: int
    cancelled_orders_count: int
    today_revenue: float
    avg_order_value: float

class TopCategoryStat(BaseModel):
    category_name: str
    items_sold: int
    revenue: float

class TopMenuItemStat(BaseModel):
    item_id: str
    item_name: str
    quantity_sold: int
    revenue: float

class AnalyticsDashboard(BaseModel):
    stats: DailyStats
    top_items: List[TopMenuItemStat]
    top_categories: List[TopCategoryStat]
    hourly_orders: Dict[str, int]
