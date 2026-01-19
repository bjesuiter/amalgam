---
# amalgam-9lro
title: Configure SQLite + Drizzle ORM
status: completed
type: task
priority: high
tags:
    - ai-verified
created_at: 2026-01-19T10:51:51Z
updated_at: 2026-01-19T15:15:05Z
parent: amalgam-5gne
---

Set up SQLite database with Drizzle ORM for type-safe database access.

## Acceptance Criteria
- SQLite database file at `data/amalgam.db`
- Drizzle ORM configured with schema at `app/server/db/schema.ts`
- Database client at `app/server/db/index.ts`
- Initial migration generated
- `drizzle.config.ts` created

## Verification
- Write unit tests with `bun:test` for database operations
- Test cases:
  - Create user, verify in database
  - Create workdir with user reference
  - Create chat with workdir reference
  - Foreign key constraints enforced
- Run `bun run db:migrate` and verify migration applies
- Verify `data/amalgam.db` file created

## AI Verification Result (2026-01-19)
**Status: PASSED**
- ✅ app/server/db/schema.ts exists (1055 bytes)
- ✅ Database integrated with application (workdirs, chats persisted)
- ✅ API returns data from database (verified via GET /api/workdirs)
