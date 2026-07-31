import uuid
from datetime import datetime, date, timezone
from typing import List, Optional
from sqlalchemy import String, Numeric, ForeignKey, Date, DateTime, Integer, Text, Enum as SQLEnum
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PREPARING = "PREPARING"
    READY = "READY"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    REFUNDED = "REFUNDED"

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"

class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    daily_order_number: Mapped[str] = mapped_column(String(10), nullable=False, index=True) # "001", "002"...
    order_date: Mapped[date] = mapped_column(Date, nullable=False, index=True, default=lambda: datetime.now(timezone.utc).date())
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(SQLEnum(OrderStatus, native_enum=False), default=OrderStatus.PREPARING, index=True)
    
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    tax_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)
    
    payment_status: Mapped[PaymentStatus] = mapped_column(SQLEnum(PaymentStatus, native_enum=False), default=PaymentStatus.PAID, index=True)
    payment_method: Mapped[PaymentMethod] = mapped_column(SQLEnum(PaymentMethod, native_enum=False), default=PaymentMethod.CASH)
    
    cashier_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    cashier: Mapped[Optional["User"]] = relationship("User", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="joined")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    menu_item_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("menu_items.id"), nullable=True)
    item_name: Mapped[str] = mapped_column(String(150), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    total_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    menu_item: Mapped[Optional["MenuItem"]] = relationship("MenuItem", back_populates="order_items")

class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(SQLEnum(PaymentMethod, native_enum=False), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    transaction_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[PaymentStatus] = mapped_column(SQLEnum(PaymentStatus, native_enum=False), default=PaymentStatus.PAID)

    order: Mapped["Order"] = relationship("Order", back_populates="payments")
