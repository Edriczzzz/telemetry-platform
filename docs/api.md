# API REST v1

Documentación interactiva: `/api/docs`. OpenAPI: `/api/openapi.json`.

## Implementado

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/health` | Estado del backend y de la base de datos |

## Planificado (Fase 4 en adelante)

| Grupo | Endpoints |
|---|---|
| Autenticación | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Misiones | `GET/POST /missions`, `GET/PATCH /missions/{id}`, `GET /missions/{id}/detections`, `/telemetry`, `/track`, `/orthomosaics` |
| Detecciones | `GET /detections` (filtros `bbox`, `mission_id`, `severity`, `attention_status`, `from`, `to`), `GET /detections/{id}`, `PATCH /detections/{id}/status`, `GET /detections/{id}/history` |
| Ingesta (API key de dispositivo) | `POST /ingest/telemetry`, `POST /ingest/detections` (por lotes, confirmación por registro) |
| Telemetría | `GET /telemetry/latest?mission_id=` |
| Ortomosaicos | `POST /orthomosaics/uploads` (URL prefirmada), `POST /orthomosaics/{id}/complete`, `GET /orthomosaics`, `GET /orthomosaics/{id}`, teselas |
| Usuarios | CRUD solo administrador |
| Sistema | `GET /system/status`, `GET /system/events`, `GET /dashboard/summary` |

## Errores

```json
{ "error": { "code": "validation_error", "message": "Los datos enviados no son válidos",
             "details": [{ "field": "body.latitude", "message": "..." }] } }
```
