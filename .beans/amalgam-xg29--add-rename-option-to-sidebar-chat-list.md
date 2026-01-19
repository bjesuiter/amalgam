---
# amalgam-xg29
title: Add rename option to sidebar chat list
status: completed
type: task
priority: normal
created_at: 2026-01-19T19:37:15Z
updated_at: 2026-01-19T19:48:52Z
---

Add right-click context menu to chat items in the sidebar (Sidebar.tsx) with a 'Rename' option, similar to the chat header context menu. Should use the same ContextMenu component and call the same PATCH /api/chats/$id endpoint.

## Checklist

- [x] Add ContextMenu to chat items in Sidebar.tsx
- [x] Add inline editing with input field, check and X buttons
- [x] Add onRenameChat callback prop to Sidebar
- [x] Add onRenameChat prop to Layout component (pass-through)
- [x] Update chat page to provide onRenameChat callback
- [x] Update workdir detail page to provide onRenameChat callback
- [x] Test: right-click shows context menu with Rename option
- [x] Test: clicking Rename shows inline input
- [x] Test: Enter saves, updates both sidebar and header