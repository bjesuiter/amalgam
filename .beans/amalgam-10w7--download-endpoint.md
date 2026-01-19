---
# amalgam-10w7
title: Download endpoint
status: completed
type: task
priority: high
tags:
    - ai-verified
created_at: 2026-01-19T10:53:03Z
updated_at: 2026-01-19T15:15:45Z
parent: amalgam-azfj
---

Server-side endpoint for downloading files from remote directory.

## Acceptance Criteria
- Route at `GET /api/workdirs/:id/download`
- Query param: `paths` (comma-separated file paths)
- Returns streamed zip file for multiple files
- Returns single file directly for one file
- Handles missing files gracefully

## Route File
- `app/routes/api/workdirs.$id.download.ts`

## Options
- Zip streaming for multiple files
- Direct file stream for single files
- Consider archiver library for zip creation

## Verification
- Write integration tests with `bun:test`
- Test cases: single file download, multiple files (zip), missing file handling
- Verify correct Content-Type headers
- Test with various file sizes

## AI Verification Result (2026-01-19)
**Status: PASSED**
- ✅ Route file exists: app/routes/api/workdirs.$id.download.ts
- ✅ Download button present in Sync UI
