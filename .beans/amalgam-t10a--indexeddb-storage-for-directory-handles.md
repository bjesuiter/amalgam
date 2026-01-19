---
# amalgam-t10a
title: IndexedDB storage for directory handles
status: todo
type: task
priority: high
created_at: 2026-01-19T10:52:22Z
updated_at: 2026-01-19T10:52:22Z
parent: amalgam-2k5g
---

Store FileSystemDirectoryHandle in IndexedDB for persistence across sessions.

## Acceptance Criteria
- Library at `app/lib/fs-storage.ts`
- Uses idb-keyval or similar for simple key-value storage
- Store/retrieve handles by workdirId
- Handle permission re-request when handle becomes invalid
- Track lastAccessedAt timestamp

## Interface
```typescript
interface WorkdirHandle {
  workdirId: string;
  handle: FileSystemDirectoryHandle;
  lastAccessedAt: number;
}
```

## Notes
- FileSystemDirectoryHandle cannot be serialized to JSON
- Must use IndexedDB's structured clone algorithm

## Verification
- Write unit tests with `bun:test` using fake-indexeddb or similar mock
- Test cases: store handle, retrieve handle, handle not found, update lastAccessedAt
- Manual validation in browser for actual IndexedDB persistence:
  - Store handle, close tab, reopen, verify handle retrieved
  - Test permission re-request flow when handle invalid