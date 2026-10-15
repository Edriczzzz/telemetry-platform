from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_health_ok_con_base_de_datos():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"


def test_health_degradado_sin_base_de_datos_no_filtra_detalles():
    class Broken:
        def execute(self, *_a, **_k):
            raise RuntimeError("password=secreto host=interno")

    app.dependency_overrides[get_db] = lambda: Broken()
    try:
        r = client.get("/api/v1/health")
    finally:
        app.dependency_overrides.clear()
    assert r.status_code == 200
    assert r.json()["status"] == "degraded"
    assert r.json()["database"] == "unavailable"
    assert "secreto" not in r.text


def test_error_de_ruta_inexistente_usa_formato_consistente():
    r = client.get("/api/v1/no-existe")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "http_404"


def test_cors_rechaza_origen_no_configurado():
    r = client.options(
        "/api/v1/health",
        headers={"Origin": "http://malicioso.example", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in r.headers
