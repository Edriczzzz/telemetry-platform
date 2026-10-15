# Plataforma web de Detección y georreferenciación de baches con VANT

Proyecto Terminal de Ingeniería en Telemática, UPIITA-IPN.

## Estado actual (Fase 2: base ejecutable)

| Parte | Estado |
|---|---|
| Modelo de datos PostgreSQL/PostGIS + migración inicial | Hecho y probado |
| Esquemas de ingesta y eventos WebSocket (contrato) | Hecho y probado |
| `GET /api/v1/health`, errores consistentes, CORS limitado | Hecho y probado |
| Frontend: layout, navegación, estado de conexión, insignia de demostración | Hecho (páginas aún son marcadores) |
| Autenticación y roles | Pendiente (Fase 4) |
| Endpoints de misiones, detecciones, telemetría | Pendiente (Fase 4) |
| WebSocket y simulador | Pendiente (Fase 5) |
| Ortomosaicos | Pendiente (Fase 6) |

Las rutas del frontend **no están protegidas todavía** porque no existe autenticación.

## Ejecutar con Docker (solo dev)

```bash
cp infra/.env.example infra/.env     # edita las contraseñas
docker compose -f infra/docker-compose.yml --env-file infra/.env up --build
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
