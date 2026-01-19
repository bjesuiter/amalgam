---
# amalgam-gjf2
title: Upload endpoint with chunked support
status: completed
type: task
priority: high
created_at: 2026-01-19T10:53:01Z
updated_at: 2026-01-19T12:06:34Z
parent: amalgam-azfj
---

Server-side endpoint for uploading files to remote directory.

## Acceptance Criteria
- Route at `POST /api/workdirs/:id/upload`
- Accepts FormData with files (path as key, file as value)
- Creates directories as needed
- Returns `{ uploaded: string[], failed: string[] }`
- Supports chunked upload for files > 5MB

## Route File
- `app/routes/api/workdirs.$id.upload.ts`

## Chunked Upload
- Client splits large files into chunks
- Server reassembles on receipt
- Consider resumable uploads for reliability

## Verification
- Write integration tests with `bun:test`
- Test cases: single file upload, multiple files, large file chunked upload
- Verify files written to correct paths
- Test error handling for failed uploads