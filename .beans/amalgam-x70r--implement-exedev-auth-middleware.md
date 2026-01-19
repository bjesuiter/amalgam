---
# amalgam-x70r
title: Implement exe.dev auth middleware
status: completed
type: task
priority: high
created_at: 2026-01-19T10:51:54Z
updated_at: 2026-01-19T11:49:27Z
parent: amalgam-5gne
---

Create authentication middleware using exe.dev built-in auth headers.

## Acceptance Criteria
- Middleware at `app/server/middleware/auth.ts`
- Reads `X-ExeDev-UserID` and `X-ExeDev-Email` headers
- Redirects to `/__exe.dev/login` if headers missing
- Upserts user record in database
- Passes userId/email in request context

## References
- See `docs/exe/all.md` for exe.dev authentication details
- See SPEC.md Authentication section for code example

## Verification
- Write unit tests with `bun:test`
- Test cases: valid headers → user upserted, missing headers → redirect
- Mock database for user upsert verification
- Test context passing to downstream handlers