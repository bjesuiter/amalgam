---
# amalgam-zhyc
title: Show file counts for local and remote workdir in Sync Status
status: todo
type: feature
priority: high
created_at: 2026-01-19T14:45:43Z
updated_at: 2026-01-19T14:45:43Z
---

Enhance Sync Status card to show two columns:
1. Server/Remote workdir with file count
2. Client/Local workdir with file count

This gives users visibility into what files exist on each side before syncing.

## Acceptance Criteria
- Show local folder name with file count (from IndexedDB handle + buildLocalManifest)
- Show remote folder with file count (from /api/workdirs/:id/manifest)
- Fetch counts on component mount and after sync operations
- Handle loading states for each count independently
- Show 'Not linked' if local folder not connected
- Show '-' or 'N/A' if counts can't be fetched

## UI Layout
```
Sync Status
Manage file synchronization between local and remote

Local                          Remote
📁 playground (12 files)       📁 playground (10 files)
                              
[Upload]  [Download]           [Change]
```

## Components to modify
- app/components/SyncControls.tsx or create new SyncStatusCard.tsx