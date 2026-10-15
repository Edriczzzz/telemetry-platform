from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Plataforma VANT - Baches CDMX"
    environment: str = Field(default="development", description="development | production")
    database_url: str = "postgresql+psycopg://vant:vant@localhost:5432/vant"
    cors_origins: str = "http://localhost:5173"
    jwt_secret: str = "CAMBIAR-EN-PRODUCCION"
    jwt_access_minutes: int = 15
    telemetry_stale_seconds: int = 10
    detection_dedup_radius_m: float = 2.0

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if s.is_production and s.jwt_secret == "CAMBIAR-EN-PRODUCCION":
        raise RuntimeError("JWT_SECRET debe definirse en producción")
    return s
