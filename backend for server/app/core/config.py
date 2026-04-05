from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "TripMind API"
    debug: bool = False

    # Database (defaults to SQLite for local dev; set to postgresql+asyncpg://... for production)
    database_url: str = "sqlite+aiosqlite:///./tripmind.db"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Auth
    secret_key: str = "change-me-in-production-use-a-real-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24h

    # Anthropic
    anthropic_api_key: str = ""

    # External APIs
    serpapi_key: str = ""
    browser_use_api_key: str = ""
    google_places_api_key: str = ""
    openweather_api_key: str = ""
    mapbox_token: str = ""

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
