from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Dict[str, Any] = Field(default_factory=dict)

class RoleRead(RoleBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=6)
    role_name: str = "CASHIER"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role_name: Optional[str] = None
    is_active: Optional[bool] = None

class UserRead(UserBase):
    id: str
    is_active: bool
    role: RoleRead
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
