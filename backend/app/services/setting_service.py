from typing import List, Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.setting import Setting
from app.schemas.setting import SystemConfigSummary
from app.core.ws_manager import ws_manager

class SettingService:
    @staticmethod
    async def get_all_settings(db: AsyncSession) -> List[Setting]:
        stmt = select(Setting)
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def get_setting_by_key(db: AsyncSession, key: str) -> Optional[Setting]:
        stmt = select(Setting).where(Setting.key == key)
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def update_setting(db: AsyncSession, key: str, value: Any) -> Setting:
        # Normalize dictionary vs primitive value formatting for JSON storage
        if isinstance(value, dict):
            if "value" in value or "can_edit_menu" in value:
                formatted_value = value if "value" in value else value
            else:
                formatted_value = value
        else:
            formatted_value = {"value": value}

        setting = await SettingService.get_setting_by_key(db, key)
        if not setting:
            setting = Setting(key=key, value=formatted_value, category="general")
            db.add(setting)
        else:
            setting.value = formatted_value

        await db.commit()
        await db.refresh(setting)
        await ws_manager.broadcast({"event": "SETTINGS_UPDATED", "timestamp": "", "data": {key: formatted_value}})
        return setting

    @staticmethod
    async def get_system_config_summary(db: AsyncSession) -> SystemConfigSummary:
        settings_list = await SettingService.get_all_settings(db)
        settings_map = {}
        for s in settings_list:
            if isinstance(s.value, dict) and "value" in s.value:
                settings_map[s.key] = s.value["value"]
            elif isinstance(s.value, dict):
                settings_map[s.key] = s.value
            else:
                settings_map[s.key] = s.value

        auto_remove = settings_map.get("auto_remove_minutes", 5)
        tax_rate = settings_map.get("tax_rate_percent", 5.0)
        canteen_name = settings_map.get("canteen_name", "Campus Smart Canteen")
        currency_symbol = settings_map.get("currency_symbol", "₹")
        qr_interval = settings_map.get("qr_display_interval_seconds", 30)
        cashier_perms = settings_map.get("cashier_permissions", {})
        
        can_edit = cashier_perms.get("can_edit_menu", True) if isinstance(cashier_perms, dict) else True

        return SystemConfigSummary(
            auto_remove_minutes=int(auto_remove),
            tax_rate_percent=float(tax_rate),
            canteen_name=str(canteen_name),
            currency_symbol=str(currency_symbol),
            cashier_can_edit_menu=bool(can_edit),
            cashier_can_cancel_order=bool(cashier_perms.get("can_cancel_order", True) if isinstance(cashier_perms, dict) else True),
            qr_display_interval_seconds=int(qr_interval)
        )
