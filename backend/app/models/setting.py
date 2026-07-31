import uuid
from typing import Optional
from sqlalchemy import String, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin

class Setting(Base, TimestampMixin):
    __tablename__ = "settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[dict] = mapped_column(JSON, nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="general") # general, display, cashier, order, payment
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
