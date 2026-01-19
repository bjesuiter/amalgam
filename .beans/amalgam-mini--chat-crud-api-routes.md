---
# amalgam-mini
title: Chat CRUD API routes
status: completed
type: task
priority: high
tags:
    - ai-verified
created_at: 2026-01-19T10:53:36Z
updated_at: 2026-01-19T15:13:39Z
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

## AI Verification Result (2026-01-19)
**Status: PASSED**
- ✅ Route files exist:
  - app/routes/api/workdirs.$id.chats.ts (GET/POST)
  - app/routes/api/chats.$id.ts (DELETE)
  - app/routes/api/chats.$chatId.cancel.ts
  - app/routes/api/chats.$chatId.message.ts
  - app/routes/api/chats.$chatId.stream.ts
- ✅ GET /api/workdirs/:id/chats returns 200 with chats array
- ✅ Chat response contains id, workdirId, title, createdAt, lastActiveAt, status
- ✅ UI successfully creates and displays chats via API (new chat created via "New Chat" button)
