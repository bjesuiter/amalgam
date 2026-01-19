---
# amalgam-mptv
title: Remote manifest API
status: todo
type: task
priority: high
created_at: 2026-01-19T10:52:54Z
updated_at: 2026-01-19T10:52:54Z
parent: amalgam-azfj
---

Server-side API to scan remote directory and return file manifest.

## Acceptance Criteria
- Route at `GET /api/workdirs/:id/manifest`
- Scans remote directory recursively
- Returns `{ files: FileManifest[] }`
- Respects same ignore patterns as client
- Handles missing directory gracefully

## Route File
- `app/routes/api/workdirs.$id.manifest.ts`

## Performance
- Consider caching for large directories
- Stream results for very large directories

## Verification
- Write integration tests with `bun:test`
- Test cases: empty directory, nested files, ignore patterns respected
- Create test directory structure for consistent results
- Verify FileManifest format (path, size, mtime)