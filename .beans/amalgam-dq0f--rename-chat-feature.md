---
# amalgam-dq0f
title: Rename chat feature
status: completed
type: feature
priority: normal
created_at: 2026-01-19T19:19:28Z
updated_at: 2026-01-19T19:22:07Z
---

Add ability to rename chats from the chat page header. Click on title to edit inline or add edit button.

## Checklist

- [x] Add PATCH endpoint to `/api/chats/$id` for updating title
- [x] Add inline editing UI in chat header
- [x] Handle Enter to save, Escape to cancel
- [x] Update local state after successful rename
- [x] Add right-click context menu with "Rename" option (shadcn ContextMenu)