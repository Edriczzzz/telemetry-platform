# Plataforma web · Detección y georreferenciación de baches con VANT (CDMX)

Proyecto Terminal, Ingeniería en Telemática, UPIITA-IPN.

## Estado actual (Fases 1 a 3 completas con datos de demostración)

| Parte | Estado |
|---|---|
| Modelo de datos PostgreSQL/PostGIS + migración inicial | Hecho y probado |
| Esquemas de ingesta y eventos WebSocket (contrato) | Hecho y probado |
| `GET /api/v1/health`, errores consistentes, CORS limitado | Hecho y probado |
| Frontend: layout, navegación, estado de conexión, insignia de demostración | Hecho |
| Frontend: panel, mapa Leaflet con filtros y capas, inventario con búsqueda/orden/paginación, detalle de bache | Hecho con **datos de demostración** (`frontend/src/services/demo`) |
| Frontend: misiones (crear, editar, detalle, zona y waypoints), monitoreo de vuelo con reproducción simulada, historial de inspecciones | Hecho con **datos de demostración** |
| Autenticación y roles | Pendiente (Fase 4) |
| Endpoints de misiones, detecciones, telemetría | Pendiente (Fase 4) |
| WebSocket y simulador | Pendiente (Fase 5) |
| Ortomosaicos | Pendiente (Fase 6) |

Una misión solo se **registra** en la plataforma: no se envía al VANT ni existen comandos de vuelo. El monitoreo distingue datos recibidos, históricos y simulados; sin telemetría real no muestra valores inventados.

Las rutas del frontend **no están protegidas todavía** porque no existe autenticación.

Los datos de demostración son simulados y deterministas (coordenadas aproximadas en torno a la Unidad Profesional Adolfo López Mateos). Con `VITE_DEMO_MODE=false` la interfaz usa la fuente real, que aún no está implementada y lo indica con un mensaje explícito.

## Ejecutar con Docker (solo desarrollo)

```bash
cp infra/.env.example infra/.env     # edita las contraseñas
docker compose -f infra/docker-compose.yml --env-file infra/.env up --build
```

Si cambian las dependencias del frontend (`package.json`), recrea el volumen de módulos:

```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env down
docker compose -f infra/docker-compose.yml --env-file infra/.env up --build -V
```

- Frontend: http://localhost:5173
- API y documentación: http://localhost:8000/api/docs
- El backend aplica las migraciones al arrancar.

## Ejecutar sin Docker

Backend (requiere PostgreSQL con PostGIS):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                 # ajusta DATABASE_URL
alembic upgrade head
uvicorn app.main:app --reload
pytest
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm test
npm run build
```

## Documentación

`docs/architecture.md`, `docs/database.md`, `docs/api.md`, `docs/integration.md`, y ejemplos JSON en `docs/examples/`.
