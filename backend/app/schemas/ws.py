from pydantic import BaseModel
from typing import Any, Dict, Optional
from datetime import datetime

class WSEvent(BaseModel):
    event: str  # ORDER_CREATED, ORDER_UPDATED, MENU_UPDATED, SETTINGS_UPDATED
    timestamp: str
    data: Dict[str, Any]
