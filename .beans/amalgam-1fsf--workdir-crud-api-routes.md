---
# amalgam-1fsf
title: Workdir CRUD API routes
status: todo
type: task
priority: high
created_at: 2026-01-19T10:52:26Z
updated_at: 2026-01-19T10:52:26Z
parent: amalgam-2k5g
---

Implement server-side API routes for workdir management.

## Acceptance Criteria
- `GET /api/workdirs` - List all workdirs for current user
- `POST /api/workdirs` - Create new workdir (name in body)
- `DELETE /api/workdirs/:id` - Delete workdir (optional deleteFiles query param)

## Route Files
- `app/routes/api/workdirs.ts`
- `app/routes/api/workdirs.$id.ts`

## Behavior
- POST creates remote directory at `/home/exedev/<userId>/<name>`
- DELETE optionally removes remote directory
- All routes require authentication (use auth middleware)