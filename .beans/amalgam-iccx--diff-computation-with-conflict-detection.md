---
# amalgam-iccx
title: Diff computation with conflict detection
status: todo
type: task
priority: high
created_at: 2026-01-19T10:52:58Z
updated_at: 2026-01-19T10:52:58Z
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