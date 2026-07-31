from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Canteen POS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    # Standard postgres URL format or async sqlite fallback
    DATABASE_URL: str = "sqlite+aiosqlite:///./canteen.db"
    
    # Redis
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str = "super-secret-canteen-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 5
    
    # System Defaults
    DEFAULT_AUTO_REMOVE_MINUTES: int = 5
    DEFAULT_CURRENCY_SYMBOL: str = "₹"
    DEFAULT_TAX_RATE_PERCENT: float = 5.0
    DEFAULT_CANTEEN_NAME: str = "Campus Smart Canteen"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
