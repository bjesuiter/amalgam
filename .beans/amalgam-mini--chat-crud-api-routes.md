---
# amalgam-mini
title: Chat CRUD API routes
status: completed
type: task
priority: high
created_at: 2026-01-19T10:53:36Z
updated_at: 2026-01-19T11:59:19Z
parent: amalgam-7u0f
---

Server-side API routes for chat management.

## Acceptance Criteria
- `GET /api/workdirs/:id/chats` - List chats for workdir
- `POST /api/workdirs/:id/chats` - Create new chat
- `DELETE /api/chats/:id` - Delete chat (kills OpenCode if running)

## Route Files
- `app/routes/api/workdirs.$id.chats.ts`
- `app/routes/api/chats.$id.ts`

## Behavior
- POST creates chat with auto-generated UUID
- DELETE kills associated OpenCode session first
- All routes require authentication

## Verification
- Write integration tests with `bun:test`
- Test cases: list chats, create chat, delete chat
- Mock OpenCode session manager for delete tests
- Verify database state after operations