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