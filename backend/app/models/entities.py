import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models import enums as e


def _enum(py_enum, name: str):
    return Enum(py_enum, name=name, values_callable=lambda x: [m.value for m in x])


def _uuid_pk():
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _now():
    return mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


_POINT_OK = "ST_X(geom) BETWEEN -180 AND 180 AND ST_Y(geom) BETWEEN -90 AND 90"


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[e.UserRole] = mapped_column(_enum(e.UserRole, "user_role"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    created_at: Mapped[datetime] = _now()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Device(Base):
    """Principal no humano (estación base o VANT) que usa la API de ingesta."""

    __tablename__ = "devices"
    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(120), unique=True)
    kind: Mapped[str] = mapped_column(String(30))  # base_station | uav | simulator
    api_key_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = _now()


class Mission(Base):
    __tablename__ = "missions"
    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[e.MissionStatus] = mapped_column(
        _enum(e.MissionStatus, "mission_status"),
        default=e.MissionStatus.BORRADOR,
        server_default=e.MissionStatus.BORRADOR.value,
        index=True,
    )
    area = mapped_column(Geometry("POLYGON", srid=4326, spatial_index=True), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = _now()
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, server_default=text("'{}'::jsonb"))
    data_origin: Mapped[e.DataOrigin] = mapped_column(
        _enum(e.DataOrigin, "data_origin"), default=e.DataOrigin.REAL, server_default="real"
    )

    waypoints = relationship("MissionWaypoint", cascade="all, delete-orphan", order_by="MissionWaypoint.seq")

    __table_args__ = (
        CheckConstraint("ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at", name="ck_mission_times"),
    )


class MissionWaypoint(Base):
    """Ruta planificada. Solo se almacena: no se envía al VANT en esta etapa."""

    __tablename__ = "mission_waypoints"
    id: Mapped[uuid.UUID] = _uuid_pk()
    mission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("missions.id", ondelete="CASCADE"), index=True)
    seq: Mapped[int] = mapped_column(Integer)
    geom = mapped_column(Geometry("POINT", srid=4326, spatial_index=True), nullable=False)
    altitude_m: Mapped[float | None] = mapped_column(Float)
    speed_ms: Mapped[float | None] = mapped_column(Float)

    __table_args__ = (
        UniqueConstraint("mission_id", "seq", name="uq_waypoint_seq"),
        CheckConstraint(_POINT_OK, name="ck_waypoint_geom_range"),
    )


class Telemetry(Base):
    __tablename__ = "telemetry"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    mission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("missions.id", ondelete="CASCADE"))
    device_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("devices.id"))
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime] = _now()
    geom = mapped_column(Geometry("POINT", srid=4326, spatial_index=True), nullable=False)
    altitude_m: Mapped[float | None] = mapped_column(Float)
    speed_ms: Mapped[float | None] = mapped_column(Float)
    battery_pct: Mapped[float | None] = mapped_column(Float)
    vehicle_state: Mapped[str | None] = mapped_column(String(40))
    extra: Mapped[dict] = mapped_column(JSONB, default=dict, server_default=text("'{}'::jsonb"))
    data_origin: Mapped[e.DataOrigin] = mapped_column(
        _enum(e.DataOrigin, "data_origin"), default=e.DataOrigin.REAL, server_default="real"
    )

    __table_args__ = (
        UniqueConstraint("mission_id", "event_id", name="uq_telemetry_event"),
        Index("ix_telemetry_mission_time", "mission_id", "recorded_at"),
        CheckConstraint(_POINT_OK, name="ck_telemetry_geom_range"),
        CheckConstraint("battery_pct IS NULL OR battery_pct BETWEEN 0 AND 100", name="ck_telemetry_battery"),
        CheckConstraint("speed_ms IS NULL OR speed_ms >= 0", name="ck_telemetry_speed"),
    )


class Detection(Base):
    __tablename__ = "detections"
    id: Mapped[uuid.UUID] = _uuid_pk()
    mission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("missions.id", ondelete="CASCADE"), index=True)
    device_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("devices.id"))
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    received_at: Mapped[datetime] = _now()
    geom = mapped_column(Geometry("POINT", srid=4326, spatial_index=True), nullable=False)
    footprint = mapped_column(Geometry("POLYGON", srid=4326, spatial_index=True), nullable=True)
    severity: Mapped[e.Severity] = mapped_column(_enum(e.Severity, "severity"), index=True)
    area_value: Mapped[float | None] = mapped_column(Numeric(12, 4))
    area_unit: Mapped[str] = mapped_column(String(8), default="m2", server_default="m2")
    confidence: Mapped[float | None] = mapped_column(Float)
    gnss_accuracy_m: Mapped[float | None] = mapped_column(Float)
    frame_id: Mapped[str | None] = mapped_column(String(120))
    source: Mapped[e.DetectionSource] = mapped_column(
        _enum(e.DetectionSource, "detection_source"), default=e.DetectionSource.MODEL, server_default="model"
    )
    attention_status: Mapped[e.AttentionStatus] = mapped_column(
        _enum(e.AttentionStatus, "attention_status"),
        default=e.AttentionStatus.PENDIENTE,
        server_default="pendiente",
        index=True,
    )
    validation_status: Mapped[e.ValidationStatus] = mapped_column(
        _enum(e.ValidationStatus, "validation_status"),
        default=e.ValidationStatus.SIN_REVISAR,
        server_default="sin_revisar",
    )
    validated_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    extra: Mapped[dict] = mapped_column(JSONB, default=dict, server_default=text("'{}'::jsonb"))
    data_origin: Mapped[e.DataOrigin] = mapped_column(
        _enum(e.DataOrigin, "data_origin"), default=e.DataOrigin.REAL, server_default="real"
    )

    __table_args__ = (
        UniqueConstraint("mission_id", "event_id", name="uq_detection_event"),
        CheckConstraint(_POINT_OK, name="ck_detection_geom_range"),
        CheckConstraint("area_value IS NULL OR area_value >= 0", name="ck_detection_area"),
        CheckConstraint("confidence IS NULL OR confidence BETWEEN 0 AND 1", name="ck_detection_confidence"),
    )


class DetectionHistory(Base):
    __tablename__ = "detection_history"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    detection_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("detections.id", ondelete="CASCADE"), index=True
    )
    field: Mapped[str] = mapped_column(String(40))  # attention_status | validation_status | severity
    old_value: Mapped[str | None] = mapped_column(String(60))
    new_value: Mapped[str] = mapped_column(String(60))
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    changed_at: Mapped[datetime] = _now()
    comment: Mapped[str | None] = mapped_column(Text)


class StoredFile(Base):
    __tablename__ = "files"
    id: Mapped[uuid.UUID] = _uuid_pk()
    storage_key: Mapped[str] = mapped_column(String(500), unique=True)
    filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    sha256: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[e.FileStatus] = mapped_column(
        _enum(e.FileStatus, "file_status"), default=e.FileStatus.PENDING, server_default="pending"
    )
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = _now()


class DetectionEvidence(Base):
    __tablename__ = "detection_evidence"
    id: Mapped[uuid.UUID] = _uuid_pk()
    detection_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("detections.id", ondelete="CASCADE"), index=True
    )
    file_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("files.id"))
    created_at: Mapped[datetime] = _now()


class Orthomosaic(Base):
    __tablename__ = "orthomosaics"
    id: Mapped[uuid.UUID] = _uuid_pk()
    mission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("missions.id", ondelete="CASCADE"), index=True)
    file_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("files.id"))
    name: Mapped[str] = mapped_column(String(200))
    file_format: Mapped[str] = mapped_column(String(20))  # geotiff | cog | png+world ...
    crs: Mapped[str | None] = mapped_column(String(40))  # p. ej. EPSG:32614
    bounds = mapped_column(Geometry("POLYGON", srid=4326, spatial_index=True), nullable=True)
    status: Mapped[e.OrthomosaicStatus] = mapped_column(
        _enum(e.OrthomosaicStatus, "orthomosaic_status"),
        default=e.OrthomosaicStatus.PENDING_UPLOAD,
        server_default="pending_upload",
    )
    status_detail: Mapped[str | None] = mapped_column(Text)
    tiles_ref: Mapped[str | None] = mapped_column(String(500))
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    uploaded_at: Mapped[datetime] = _now()
    extra: Mapped[dict] = mapped_column(JSONB, default=dict, server_default=text("'{}'::jsonb"))


class SystemEvent(Base):
    __tablename__ = "system_events"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    occurred_at: Mapped[datetime] = _now()
    level: Mapped[str] = mapped_column(String(10), index=True)  # info | warning | error
    category: Mapped[str] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(Text)  # nunca credenciales ni trazas sensibles
    mission_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("missions.id", ondelete="SET NULL"))


class CommLinkSample(Base):
    """Muestras de enlace para el experimento de confiabilidad del Módulo 4."""

    __tablename__ = "comm_link_samples"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    mission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("missions.id", ondelete="CASCADE"), index=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    distance_m: Mapped[float | None] = mapped_column(Float)
    rssi_dbm: Mapped[float | None] = mapped_column(Float)
    snr_db: Mapped[float | None] = mapped_column(Float)
    packet_loss_pct: Mapped[float | None] = mapped_column(Float)
    detection_rate: Mapped[float | None] = mapped_column(Float)
    data_origin: Mapped[e.DataOrigin] = mapped_column(
        _enum(e.DataOrigin, "data_origin"), default=e.DataOrigin.REAL, server_default="real"
    )
