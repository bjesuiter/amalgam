---
# amalgam-iccx
title: Diff computation with conflict detection
status: completed
type: task
priority: high
created_at: 2026-01-19T10:52:58Z
updated_at: 2026-01-19T11:57:01Z
parent: amalgam-azfj
---

Compute differences between local and remote manifests with conflict detection.

## Acceptance Criteria
- Function in `app/lib/sync.ts`
- `computeDiff(local: FileManifest[], remote: FileManifest[], lastSyncedAt?: Date): SyncDiff`
- Returns categorized files:
  - newFiles: in local but not remote
  - changedFiles: different size OR mtime
  - unchangedFiles: same size AND mtime
  - deletedFiles: in remote but not local
  - conflicts: changed on both sides since last sync

## Interface
```typescript
interface SyncDiff {
  newFiles: FileManifest[];
  changedFiles: FileManifest[];
  unchangedFiles: FileManifest[];
  deletedFiles: FileManifest[];
  conflicts: ConflictInfo[];
}

interface ConflictInfo {
  path: string;
  local: FileManifest;
  remote: FileManifest;
}
```

## Verification
- Write comprehensive unit tests with `bun:test`
- Test cases:
  - Empty manifests → no changes
  - New file in local → newFiles
  - File with different size → changedFiles
  - File with different mtime → changedFiles
  - File in remote only → deletedFiles
  - Same file, same size/mtime → unchangedFiles
  - File changed on both sides since lastSyncedAt → conflicts
- This is pure logic, fully testable without browser APIs