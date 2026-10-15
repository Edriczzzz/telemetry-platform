from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[dict] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    environment: str
    database: Literal["ok", "unavailable"]
    server_time: datetime
