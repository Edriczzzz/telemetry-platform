from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Sistema"])


@router.get("/health", response_model=HealthResponse, summary="Estado del backend")
def health(db: Session = Depends(get_db)) -> HealthResponse:
    """Responde 200 si el proceso está vivo; `database` indica si PostgreSQL responde.
    No expone errores internos ni credenciales."""
    try:
        db.execute(text("SELECT 1"))
        db_state = "ok"
    except Exception:  # noqa: BLE001 - no filtrar detalles al cliente
        db_state = "unavailable"
    return HealthResponse(
        status="ok" if db_state == "ok" else "degraded",
        environment=get_settings().environment,
        database=db_state,
        server_time=datetime.now(timezone.utc),
    )
