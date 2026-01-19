---
# amalgam-skzh
title: Add option to show native browser context menu
status: completed
type: task
priority: normal
created_at: 2026-01-19T19:37:18Z
updated_at: 2026-01-19T19:54:24Z
---

Implemented Shift+Right-click to show native browser context menu. Modified ContextMenuTrigger component in context-menu.tsx to detect Shift key and temporarily disable the custom menu. Added hints ('Shift+Right-click for browser menu') to both sidebar chat item and chat header context menus.