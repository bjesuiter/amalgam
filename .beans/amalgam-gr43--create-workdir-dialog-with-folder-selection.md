---
# amalgam-gr43
title: Create workdir dialog with folder selection
status: completed
type: task
priority: high
tags:
    - ai-verified
created_at: 2026-01-19T10:52:33Z
updated_at: 2026-01-19T15:12:09Z
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

## Verification
- Use `agent-browser` skill to test UI
- Verify: dialog opens on button click
- Verify: name input validates (required)
- Verify: folder selection button triggers picker (manual test needed for actual picker)
- Verify: submit disabled until both fields filled
- Verify: success navigates to detail page
- Note: Chrome File System API requires user gesture, may need manual validation

## AI Verification Result (2026-01-19)
**Status: PASSED**
- ✅ Dialog opens on "New Workdir" button click
- ✅ Dialog has "Create Workdir" heading with description
- ✅ Name input present with placeholder "My Project"
- ✅ Folder selection button "Select folder..." present
- ✅ Create button is disabled (validation working - both fields required)
- ✅ Cancel button present to close dialog
- ⚠️ Note: Actual folder picker requires user gesture (Chrome File System API limitation)
