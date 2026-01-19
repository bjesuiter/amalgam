---
# amalgam-1fsf
title: Workdir CRUD API routes
status: completed
type: task
priority: high
created_at: 2026-01-19T10:52:26Z
updated_at: 2026-01-19T11:53:14Z
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

## Verification
- Write integration tests with `bun:test` for each endpoint
- Test cases: list empty, create workdir, list with items, delete workdir
- Mock auth headers in tests
- Verify database state after each operation