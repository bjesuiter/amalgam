---
# amalgam-9c7a
title: Workdir list and detail UI
status: todo
type: task
priority: high
created_at: 2026-01-19T10:52:29Z
updated_at: 2026-01-19T10:52:29Z
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