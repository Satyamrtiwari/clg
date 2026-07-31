import uuid
from typing import List, Optional
from sqlalchemy import String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin

class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True) # ADMIN, CASHIER
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    permissions: Mapped[dict] = mapped_column(JSON, default=dict)

    users: Mapped[List["User"]] = relationship("User", back_populates="role")

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[str] = mapped_column(String(36), ForeignKey("roles.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    role: Mapped["Role"] = relationship("Role", back_populates="users", lazy="joined")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="cashier")
