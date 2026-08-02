from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, Optional

class SettingRead(BaseModel):
    id: str
    key: str
    value: Dict[str, Any]
    category: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class SettingUpdate(BaseModel):
    value: Any

class SystemConfigSummary(BaseModel):
    auto_remove_minutes: int = 5
    tax_rate_percent: float = 5.0
    canteen_name: str = "Campus Smart Canteen"
    currency_symbol: str = "₹"
    working_hours: Dict[str, str] = {"open": "08:00", "close": "20:00"}
    payment_methods: list[str] = ["CASH", "UPI", "CARD"]
    cashier_can_edit_menu: bool = False
    cashier_can_cancel_order: bool = True
    qr_display_interval_seconds: int = 30
