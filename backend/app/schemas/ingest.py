"""Contrato de ingesta: lo que la estación base envía al backend."""
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.enums import DataOrigin, Severity

Lat = Annotated[float, Field(ge=-90, le=90)]
Lon = Annotated[float, Field(ge=-180, le=180)]

MAX_FUTURE_SKEW = timedelta(minutes=5)


def _check_aware_not_future(v: datetime) -> datetime:
    if v.tzinfo is None:
        raise ValueError("La marca de tiempo debe incluir zona horaria (UTC recomendado)")
    if v > datetime.now(timezone.utc) + MAX_FUTURE_SKEW:
        raise ValueError("La marca de tiempo está en el futuro")
    return v


class TelemetryIn(BaseModel):
    event_id: UUID = Field(description="Identificador único del evento; garantiza idempotencia")
    mission_id: UUID
    recorded_at: datetime
    latitude: Lat
    longitude: Lon
    altitude_m: float | None = Field(default=None, ge=-500, le=10000)
    speed_ms: float | None = Field(default=None, ge=0, le=100)
    battery_pct: float | None = Field(default=None, ge=0, le=100)
    vehicle_state: str | None = Field(default=None, max_length=40)
    extra: dict = Field(default_factory=dict)
    data_origin: DataOrigin = DataOrigin.REAL

    _ts = field_validator("recorded_at")(_check_aware_not_future)


class DetectionIn(BaseModel):
    event_id: UUID
    mission_id: UUID
    detected_at: datetime
    latitude: Lat
    longitude: Lon
    severity: Severity
    area_value: float | None = Field(default=None, ge=0)
    area_unit: str = Field(default="m2", pattern="^(m2|cm2)$")
    confidence: float | None = Field(default=None, ge=0, le=1)
    gnss_accuracy_m: float | None = Field(default=None, ge=0)
    frame_id: str | None = Field(default=None, max_length=120)
    extra: dict = Field(default_factory=dict)
    data_origin: DataOrigin = DataOrigin.REAL

    _ts = field_validator("detected_at")(_check_aware_not_future)


class TelemetryBatch(BaseModel):
    items: list[TelemetryIn] = Field(min_length=1, max_length=500)


class DetectionBatch(BaseModel):
    items: list[DetectionIn] = Field(min_length=1, max_length=500)


class IngestItemResult(BaseModel):
    event_id: UUID
    outcome: str = Field(pattern="^(accepted|duplicate|rejected)$")
    reason: str | None = None


class IngestResult(BaseModel):
    """Confirmación explícita: la estación base solo marca como enviado lo 'accepted' o 'duplicate'."""

    received_at: datetime
    accepted: int
    duplicates: int
    rejected: int
    results: list[IngestItemResult]
