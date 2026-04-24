# Architecture Overview

## High-level flow

1. User interacts with the Next.js frontend.
2. Frontend calls Django REST API for CRUD operations.
3. Django reads/writes relational data in PostgreSQL.
4. Django Channels emits realtime events over WebSocket.
5. Redis acts as channel layer and pub/sub backbone.
6. Connected clients update UI instantly (calendar, notifications, counters).

## Core domain entities

- User
- Department
- StaffProfile
- ShiftType
- WorkAssignment
- StaffAvailability
- Notification
- AuditLog

## Realtime channels

- `ws/schedule/`: assignment and availability events
- `ws/notifications/`: user-specific notification events

## Deployment topology

- Nginx reverse proxy
- Next.js frontend container
- Django backend container
- PostgreSQL container
- Redis container
