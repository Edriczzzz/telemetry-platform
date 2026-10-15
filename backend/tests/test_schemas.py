from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from pydantic import TypeAdapter, ValidationError

from app.schemas.events import WsEvent
from app.schemas.ingest import DetectionIn, TelemetryIn

NOW = datetime.now(timezone.utc)


def _tel(**kw):
    base = dict(event_id=uuid4(), mission_id=uuid4(), recorded_at=NOW, latitude=19.5, longitude=-99.14)
    return {**base, **kw}


def _det(**kw):
    base = dict(
        event_id=uuid4(), mission_id=uuid4(), detected_at=NOW,
        latitude=19.5, longitude=-99.14, severity="media",
    )
    return {**base, **kw}


def test_telemetria_valida():
    t = TelemetryIn(**_tel(battery_pct=80, altitude_m=15))
    assert t.data_origin.value == "real"


@pytest.mark.parametrize("campo,valor", [
    ("latitude", 91), ("longitude", -181), ("battery_pct", 101), ("speed_ms", -1),
])
def test_telemetria_rechaza_rangos_invalidos(campo, valor):
    with pytest.raises(ValidationError):
        TelemetryIn(**_tel(**{campo: valor}))


def test_rechaza_fecha_sin_zona_horaria():
    with pytest.raises(ValidationError):
        TelemetryIn(**_tel(recorded_at=datetime.now()))


def test_rechaza_fecha_futura():
    with pytest.raises(ValidationError):
        TelemetryIn(**_tel(recorded_at=NOW + timedelta(hours=1)))


def test_deteccion_valida_y_rangos():
    DetectionIn(**_det(confidence=0.9, area_value=0.35))
    with pytest.raises(ValidationError):
        DetectionIn(**_det(confidence=1.2))
    with pytest.raises(ValidationError):
        DetectionIn(**_det(severity="critica"))
    with pytest.raises(ValidationError):
        DetectionIn(**_det(area_unit="km2"))


def test_evento_ws_se_discrimina_por_type():
    ev = TypeAdapter(WsEvent).validate_python({
        "type": "detection.created", "event_id": str(uuid4()),
        "occurred_at": NOW.isoformat(), "server_time": NOW.isoformat(),
        "mission_id": str(uuid4()), "data_origin": "simulated",
        "data": {"id": str(uuid4()), "latitude": 19.5, "longitude": -99.1, "severity": "alta",
                 "attention_status": "pendiente", "validation_status": "sin_revisar"},
    })
    assert ev.type == "detection.created"
    assert ev.data_origin.value == "simulated"


def test_evento_ws_con_type_desconocido_falla():
    with pytest.raises(ValidationError):
        TypeAdapter(WsEvent).validate_python({"type": "algo.raro", "data": {}})


# --- Los ejemplos de docs/ deben cumplir los esquemas ---
import json
from pathlib import Path

from app.schemas.ingest import DetectionBatch, TelemetryBatch

EX = Path(__file__).resolve().parents[2] / "docs" / "examples"


def _load(name):
    return json.loads((EX / name).read_text())


def test_ejemplos_de_ingesta_son_validos():
    # Las fechas de los ejemplos son fijas; se comprueba estructura y rangos, no la regla de "futuro".
    TelemetryBatch.model_validate(_load("telemetry.json"))
    DetectionBatch.model_validate(_load("detection.json"))


def test_ejemplos_ws_son_validos():
    for f in ("ws-detection-created.json", "ws-connection-status.json"):
        TypeAdapter(WsEvent).validate_python(_load(f))
