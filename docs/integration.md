# Integración con la estación base

La estación base envía lotes (hasta 500 registros) al backend. Ejemplos válidos, comprobados por las pruebas:

- Telemetría: `docs/examples/telemetry.json`
- Detecciones: `docs/examples/detection.json`
- Eventos WebSocket: `docs/examples/ws-*.json`

## Reglas del contrato

- Fechas ISO 8601 **con zona horaria**; se rechazan fechas con más de 5 minutos en el futuro.
- `event_id` (UUID) obligatorio y único por registro. Reenviar el mismo `event_id` es seguro: se responde `duplicate`.
- Rangos: latitud ±90, longitud ±180, batería 0–100, velocidad ≥ 0, confianza 0–1.
- `severity`: `baja`, `media`, `alta` (se alineará con las clases del modelo de IA).
- Recomendado en detecciones: `frame_id` (para emparejar la foto después) y `gnss_accuracy_m`.
- La estación base debe conservar los registros hasta recibir `accepted` o `duplicate`.

## Sustituir el simulador por datos reales

El backend tendrá `app/integrations/base_station/interface.py` con la interfaz, `simulated.py` y `real.py`. El frontend solo consume la API y el WebSocket, por lo que no cambia. Todo dato simulado lleva `data_origin = "simulated"` y se rotula en la interfaz.
