# ArohaAI Main Backend Service

This Node/Express backend service handles API requests and forwards AI processing tasks to the Python FastAPI AI service.

## Configuration

Environment variables defined in `.env`:
- `PORT`: Service port (default: `8000`)
- `AI_SERVICE_URL`: Base URL for Python FastAPI AI service (default: `http://127.0.0.1:8001`)

## Endpoints

- **GET `/health`**: Returns backend health status.
- **POST `/api/analyze`**: Receives `{ user_id, checkin_id, response }` and forwards to `${AI_SERVICE_URL}/analyze`.

## Running locally

```bash
cd backend
npm install
npm start
```
