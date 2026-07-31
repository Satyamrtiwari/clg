from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role, get_current_user
from app.models.user import User
from app.schemas.setting import SettingRead, SettingUpdate, SystemConfigSummary
from app.services.setting_service import SettingService

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/config", response_model=SystemConfigSummary)
async def get_system_config(db: AsyncSession = Depends(get_db)):
    """Public system configuration summary (auto remove timer, tax rate, canteen name, currency)"""
    return await SettingService.get_system_config_summary(db)

@router.get("", response_model=List[SettingRead])
async def get_all_settings(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    return await SettingService.get_all_settings(db)

@router.put("/{key}", response_model=SettingRead)
async def update_setting(
    key: str,
    setting_in: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    return await SettingService.update_setting(db, key, setting_in.value)
