---
# amalgam-v48d
title: Sync UI with progress and conflict dialogs
status: todo
type: task
priority: high
created_at: 2026-01-19T10:53:07Z
updated_at: 2026-01-19T10:53:07Z
parent: amalgam-azfj
---

User interface for file sync operations including progress and conflict resolution.

## Acceptance Criteria
- SyncControls component with Upload/Download buttons
- Progress indicator during sync
- ConflictDialog for resolving conflicts
- Options: 'Overwrite', 'Skip', 'Cancel'
- Success/error toast notifications
- Update lastSyncedAt on completion

## Components
- `app/components/SyncControls.tsx`
- `app/components/ConflictDialog.tsx`

## Upload Flow (from SPEC.md)
1. Check handle validity
2. Build local manifest
3. Fetch remote manifest
4. Compute diff
5. Show conflicts if any
6. Upload new/changed files
7. Update lastSyncedAt

## Download Flow
Similar but reversed direction