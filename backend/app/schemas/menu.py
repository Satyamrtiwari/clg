from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class CategoryRead(CategoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# MenuItem Schemas
class MenuItemBase(BaseModel):
    category_id: str
    name: str = Field(..., max_length=150)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    image_url: Optional[str] = None
    is_available: bool = True
    is_todays_special: bool = False
    prep_time_minutes: int = Field(default=10, ge=1)
    available_days: List[str] = Field(default_factory=list)
    available_start_time: Optional[str] = None
    available_end_time: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    is_todays_special: Optional[bool] = None
    prep_time_minutes: Optional[int] = Field(None, ge=1)
    available_days: Optional[List[str]] = None
    available_start_time: Optional[str] = None
    available_end_time: Optional[str] = None

class MenuItemRead(MenuItemBase):
    id: str
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryRead] = None

    model_config = ConfigDict(from_attributes=True)
