---
# amalgam-o0wc
title: Debug Sidebar Toggle Button
status: todo
type: task
priority: normal
created_at: 2026-01-19T15:57:58Z
updated_at: 2026-01-19T15:58:01Z
parent: amalgam-x0od
---

Add a toggle button next to the "delete chat" icon to open/close the debug sidebar.

## Context

The chat header in `app/routes/workdirs/$workdirId/chats/$chatId.tsx` currently has:
- Chat title + status badge on the left
- Delete button (Trash2 icon) on the right (lines 244-250)

The debug sidebar (see parent feature) needs a toggle button in this header.

## Requirements

### Button Design

- Position: Immediately LEFT of the delete (Trash2) button
- Icon: Use `Bug` or `Terminal` icon from lucide-react (Bug preferred for "debug")
- Size: Same as delete button (`size="icon"`, `variant="outline"`)
- Tooltip: "Toggle Debug Panel" (if tooltip component available, otherwise skip)

### Behavior

- Click toggles sidebar open/closed state
- Visual indicator when sidebar is open (e.g., different variant or highlighted border)
- State should be managed in chat page and passed to DebugSidebar

### Visibility

- Button should ONLY appear in dev mode
- Use `isDevMode()` from `app/lib/devMode.ts` to conditionally render

## Checklist

- [ ] Add Bug icon import from lucide-react
- [ ] Add debugSidebarOpen state to chat page
- [ ] Add toggle button next to delete button (conditionally in dev mode)
- [ ] Wire up onClick to toggle state
- [ ] Pass open state to DebugSidebar component
- [ ] Add visual feedback for open/closed state