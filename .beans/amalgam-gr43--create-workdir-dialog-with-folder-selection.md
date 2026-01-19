---
# amalgam-gr43
title: Create workdir dialog with folder selection
status: todo
type: task
priority: high
created_at: 2026-01-19T10:52:33Z
updated_at: 2026-01-19T10:52:33Z
parent: amalgam-2k5g
---

Dialog for creating new workdirs with local folder selection.

## Acceptance Criteria
- CreateWorkdirDialog component
- Input for workdir name
- Button to select local directory (Chrome File System API)
- Shows selected directory path
- Creates workdir on server and stores handle in IndexedDB
- Validation: name required, directory required

## Components
- `app/components/CreateWorkdirDialog.tsx`

## Flow
1. User clicks 'New Workdir'
2. Dialog opens with name input
3. User clicks 'Select Folder' → Chrome directory picker
4. User enters name and confirms
5. POST to /api/workdirs
6. Store handle in IndexedDB
7. Navigate to new workdir detail page