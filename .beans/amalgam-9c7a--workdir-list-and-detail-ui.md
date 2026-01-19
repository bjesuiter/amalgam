---
# amalgam-9c7a
title: Workdir list and detail UI
status: completed
type: task
priority: high
tags:
    - ai-verified
created_at: 2026-01-19T10:52:29Z
updated_at: 2026-01-19T15:11:37Z
parent: amalgam-2k5g
---

Build the UI for listing and viewing workdirs.

## Acceptance Criteria
- WorkdirList component showing all user workdirs
- WorkdirCard component with name, last synced date, actions
- WorkdirDetailPage at `/workdirs/:id`
- Shows workdir info, sync status, chat list
- Delete confirmation dialog

## Components
- `app/components/WorkdirList.tsx`
- `app/components/WorkdirCard.tsx`
- `app/routes/workdirs/index.tsx`
- `app/routes/workdirs/$workdirId/index.tsx`

## Data Fetching
- Use TanStack Query for data fetching
- Optimistic updates for better UX

## Verification
- Use `agent-browser` skill to test UI
- Verify: workdir list displays items correctly
- Verify: workdir card shows name, sync date, actions
- Verify: clicking card navigates to detail page
- Verify: delete confirmation dialog works
- Write component tests with `bun:test` + testing-library if applicable

## AI Verification Result (2026-01-19)
**Status: PASSED**
- ✅ WorkdirList component shows all workdirs at /workdirs
- ✅ WorkdirCard shows name ("Playground") and sync date ("Never synced")
- ✅ Clicking workdir navigates to detail page /workdirs/:id
- ✅ WorkdirDetailPage shows:
  - Workdir name and sync status
  - Sync Status card with Upload/Download buttons
  - Chats card with New Chat button
  - Recent Chats list
- ✅ Delete confirmation dialog:
  - Opens when clicking trash icon
  - Shows "Delete Workdir" heading
  - Displays confirmation message with workdir name
  - Has Cancel and Delete buttons
