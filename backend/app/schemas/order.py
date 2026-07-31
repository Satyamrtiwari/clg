from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from app.models.order import OrderStatus, PaymentStatus, PaymentMethod

class OrderItemCreate(BaseModel):
    menu_item_id: str
    quantity: int = Field(gt=0, default=1)
    notes: Optional[str] = None

class OrderItemRead(BaseModel):
    id: str
    menu_item_id: Optional[str] = None
    item_name: str
    unit_price: float
    quantity: int
    total_price: float
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=100)
    items: List[OrderItemCreate] = Field(min_length=1)
    payment_method: PaymentMethod = PaymentMethod.CASH
    discount_amount: float = Field(ge=0, default=0.0)

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderRead(BaseModel):
    id: str
    daily_order_number: str
    order_date: date
    customer_name: str
    status: OrderStatus
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    cashier_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    items: List[OrderItemRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class OrderDisplayCard(BaseModel):
    id: str
    daily_order_number: str
    customer_name: str
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    items_count: int

    model_config = ConfigDict(from_attributes=True)
