---
# amalgam-j1wz
title: Local manifest building
status: todo
type: task
priority: high
created_at: 2026-01-19T10:52:52Z
updated_at: 2026-01-19T10:52:52Z
parent: amalgam-azfj
---

Build file manifest from local directory using Chrome FS API.

## Acceptance Criteria
- Function in `app/lib/sync.ts`
- `buildLocalManifest(handle: FileSystemDirectoryHandle): Promise<FileManifest[]>`
- Respects ignore patterns
- Returns path, size, mtime for each file
- Handles large directories efficiently

## Dependencies
- Chrome File System API wrapper (amalgam-tdxb)
- Ignore patterns (this milestone)

## Verification
- Write unit tests with `bun:test` using mocked FileSystemDirectoryHandle
- Test cases: empty directory, nested files, ignored files filtered out
- Verify FileManifest format (path, size, mtime)
- Manual validation in browser with real directory for integration testing