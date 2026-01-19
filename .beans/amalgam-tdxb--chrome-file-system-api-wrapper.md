---
# amalgam-tdxb
title: Chrome File System API wrapper
status: todo
type: task
priority: high
created_at: 2026-01-19T10:52:19Z
updated_at: 2026-01-19T10:52:19Z
parent: amalgam-2k5g
---

Create a wrapper library for the Chrome File System Access API.

## Acceptance Criteria
- Library at `app/lib/fs-api.ts`
- `selectDirectory()` - Opens directory picker with readwrite mode
- `readDirectoryRecursive()` - Recursively reads directory, returns FileManifest[]
- `writeFile()` - Writes blob to path, creating directories as needed
- `readFile()` - Reads file content as Blob
- Proper TypeScript types for FileSystemDirectoryHandle

## Interface
```typescript
interface FileManifest {
  path: string;      // Relative path from workdir root
  size: number;      // Bytes
  mtime: number;     // Unix timestamp (milliseconds)
}
```

## Notes
- Chrome/Edge only (acceptable per design decisions)
- Handle permission errors gracefully

## Verification
- Write unit tests with `bun:test` where possible (mock FileSystemDirectoryHandle)
- Note: Chrome File System API requires browser context
- Manual validation needed for actual file operations:
  - Test selectDirectory opens picker
  - Test readDirectoryRecursive returns correct manifest
  - Test writeFile creates files and directories
- Use `agent-browser` skill in Chrome to test actual API interactions