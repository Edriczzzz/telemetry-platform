"""Eventos WebSocket tipados. El frontend discrimina por el campo 'type'."""
from datetime import datetime
from typing import Annotated, Literal, Union
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import (
    AttentionStatus,
    DataOrigin,
    MissionStatus,
    OrthomosaicStatus,
    Severity,
    ValidationStatus,
)


class _Envelope(BaseModel):
    version: int = 1
    event_id: UUID
    occurred_at: datetime
    server_time: datetime
    mission_id: UUID | None = None
    data_origin: DataOrigin = DataOrigin.REAL


class TelemetryData(BaseModel):
    latitude: float
    longitude: float
    altitude_m: float | None = None
    speed_ms: float | None = None
    battery_pct: float | None = None
    vehicle_state: str | None = None


class DetectionData(BaseModel):
    id: UUID
    latitude: float
    longitude: float
    severity: Severity
    area_value: float | None = None
    area_unit: str = "m2"
    confidence: float | None = None
    attention_status: AttentionStatus
    validation_status: ValidationStatus


class MissionData(BaseModel):
    id: UUID
    name: str
    status: MissionStatus
    detections_count: int = 0


class ConnectionData(BaseModel):
    component: Literal["base_station", "uav_link", "database", "websocket"]
    state: Literal["online", "degraded", "offline"]
    detail: str | None = None


class OrthomosaicData(BaseModel):
    id: UUID
    status: OrthomosaicStatus
    status_detail: str | None = None


class TelemetryUpdated(_Envelope):
    type: Literal["telemetry.updated"] = "telemetry.updated"
    data: TelemetryData


class DetectionCreated(_Envelope):
    type: Literal["detection.created"] = "detection.created"
    data: DetectionData


class DetectionUpdated(_Envelope):
    type: Literal["detection.updated"] = "detection.updated"
    data: DetectionData


class MissionUpdated(_Envelope):
    type: Literal["mission.updated"] = "mission.updated"
    data: MissionData


class ConnectionStatusChanged(_Envelope):
    type: Literal["connection.status_changed"] = "connection.status_changed"
    data: ConnectionData


class OrthomosaicUpdated(_Envelope):
    type: Literal["orthomosaic.updated"] = "orthomosaic.updated"
    data: OrthomosaicData


WsEvent = Annotated[
    Union[
        TelemetryUpdated,
        DetectionCreated,
        DetectionUpdated,
        MissionUpdated,
        ConnectionStatusChanged,
        OrthomosaicUpdated,
    ],
    Field(discriminator="type"),
]
