from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    app_env: str = "development"
    database_url: str = "sqlite:///./ecommerce.db"
    jwt_secret_key: str = "replace-this-development-secret-before-deploying"
    access_token_minutes: int = 20
    refresh_token_days: int = 14
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    frontend_base_url: str = "http://localhost:3000"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def require_production_secret(self) -> "Settings":
        if self.app_env.lower() in {"prod", "production"} and len(self.jwt_secret_key) < 32:
            raise ValueError("JWT_SECRET_KEY must contain at least 32 characters in production")
        if self.app_env.lower() in {"prod", "production"} and self.jwt_secret_key == "replace-this-development-secret-before-deploying":
            raise ValueError("Set a unique JWT_SECRET_KEY before production deployment")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()