# Arquitectura

```
VANT (IA a bordo) --915 MHz--> Estación base --HTTPS (API key)--> Backend FastAPI --> PostgreSQL/PostGIS
                                                                       |                    ^
                                                                  WebSocket              archivos (MinIO, Fase 6)
                                                                       v
                                                         Web React/Leaflet · App móvil (futura)
Post-vuelo: fotos (manual) --> fotogrametría local --> ortomosaico --> carga a la plataforma
```

## Decisiones

- **La detección ocurre a bordo.** El backend solo recibe registros ya detectados. (El protocolo menciona en otras secciones el servidor o la estación base; conviene unificar el texto.)
- **Detecciones puntuales.** Por el ancho de banda de 915 MHz solo viajan punto, severidad y área. `footprint` (polígono) queda nulo hasta que exista una fuente fiable.
- **Idempotencia.** Cada registro lleva `event_id`; `UNIQUE(mission_id, event_id)`. La estación base solo da por enviado lo que el backend confirma (`accepted` o `duplicate`).
- **Validación y atención son campos distintos.** `validation_status` (sin revisar, confirmado, falso positivo) y `attention_status` (pendiente, programado, en reparación, atendido). La severidad es un tercer concepto.
- **Origen del dato.** `data_origin` (`real`, `simulated`, `historical`) en misiones, telemetría y detecciones; la interfaz lo rotula.
- **Sin comandos de vuelo.** La plataforma planifica y almacena rutas; no las envía ni arma, despega o aterriza el VANT.
- **Autenticación (se implementa en Fase 4):** JWT de acceso corto con refresh en cookie httpOnly para web, bearer para móvil y API key por `device` para la estación base.
- **Contrato único.** El cliente TypeScript se genera desde OpenAPI (`npm run gen:api`) para no desincronizar tipos.

## Riesgos conocidos

Detecciones duplicadas por traslape de fotogramas (deduplicación espacial, radio configurable `DETECTION_DEDUP_RADIUS_M`), precisión GNSS de varios metros (`gnss_accuracy_m`), GeoTIFF no visible directo en Leaflet (COG + TiTiler o teselas), y suspensión de servicios gratuitos de despliegue.
