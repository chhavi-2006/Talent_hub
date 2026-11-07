from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "TalentHub v2 — Enterprise Campus Placement Portal"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./talenthub_v2.db"
    
    # JWT & Auth
    SECRET_KEY: str = "talenthub-v2-production-grade-secret-change-in-env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 240  # 4 hours
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Placement Policies
    DREAM_OFFER_MULTIPLIER: float = 1.5  # Student can only upgrade if new offer >= 1.5x current
    DREAM_OFFER_THRESHOLD_LPA: float = 12.0  # Above 12 LPA is considered Dream Category
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
