# Deployment Guide

## Prerequisites

- Docker + Docker Compose

## Steps

1. Go to `infra/`
2. Copy `.env.example` to `.env` and adjust credentials.
3. Run:

```bash
docker compose up --build
```

4. Open:
   - `http://localhost` (Nginx reverse proxy)
   - `http://localhost:3000` (frontend direct)
   - `http://localhost:8000/admin` (backend admin direct)

## Production notes

- Use strong `DJANGO_SECRET_KEY`.
- Set `DJANGO_DEBUG=False`.
- Configure trusted hosts and CORS.
- Terminate SSL at Nginx (or upstream load balancer).
- Add backup jobs for PostgreSQL and media files.
