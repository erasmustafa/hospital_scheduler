# Hospital Workforce SaaS Starter

This repository provides a full-stack starter architecture for a hospital staff scheduling and shift management SaaS.

## Tech Stack

- Frontend: Next.js (App Router) + Tailwind CSS + shadcn style primitives
- Backend: Django + Django REST Framework + Channels
- Realtime: WebSocket via Django Channels
- Database: PostgreSQL (SQLite fallback for local quick start)
- Cache/Broker: Redis
- Deployment: Docker + Nginx

## Repository Layout

- `frontend/`: Next.js app
- `backend/`: Django project and domain apps
- `infra/`: Docker and Nginx setup
- `docs/`: Architecture and API contract docs

## Quick Start (Local)

1. Backend
   - `cd backend`
   - `python -m venv .venv`
   - `.venv\Scripts\activate`
   - `pip install -r requirements.txt`
   - `python manage.py migrate`
   - `python manage.py runserver`

2. Frontend
   - `cd frontend`
   - `npm install`
   - `npm run dev`

3. Open
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/api/`

## Notes

- For production, prefer running via `infra/docker-compose.yml`.
- WebSocket endpoints:
  - `ws://<host>/ws/schedule/`
  - `ws://<host>/ws/notifications/`
