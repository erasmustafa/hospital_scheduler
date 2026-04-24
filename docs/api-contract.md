# API Contract

Base URL: `/api`

## Auth

- `POST /auth/login/`
  - Request:
    - Credential login: `{ "username": "...", "password": "..." }`
    - One-click login: `{}` (or empty payload)
  - Response: `{ "user": { ... } }`
- `POST /auth/logout/`
- `GET /auth/me/`

## Staff / Departments

- `GET|POST /staff/`
- `GET|PATCH|DELETE /staff/{id}/`
- `GET|POST /departments/`
- `GET|PATCH|DELETE /departments/{id}/`

## Scheduling

- `GET|POST /shift-types/`
- `GET|PATCH|DELETE /shift-types/{id}/`
- `GET|POST /unit-requirements/`
- `GET|PATCH|DELETE /unit-requirements/{id}/`
- `GET|POST /assignments/`
- `GET|PATCH|DELETE /assignments/{id}/`
- `GET|POST /availability/`
- `GET|PATCH|DELETE /availability/{id}/`
- `GET /dashboard/summary/`
- `GET /analytics/report/`
- `POST /auto-schedule/preview/`
- `POST /auto-schedule/commit/`

## Notifications

- `GET /notifications/`
- `PATCH /notifications/{id}/read/`

## WebSocket events

### Schedule channel (`/ws/schedule/`)

- `assignment.created`
- `assignment.updated`
- `assignment.deleted`
- `availability.created`

### Notification channel (`/ws/notifications/`)

- `notification.new`
- `notification.read`
