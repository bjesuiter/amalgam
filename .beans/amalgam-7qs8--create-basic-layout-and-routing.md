---
# amalgam-7qs8
title: Create basic layout and routing
status: todo
type: task
priority: high
created_at: 2026-01-19T10:51:58Z
updated_at: 2026-01-19T10:51:58Z
parent: amalgam-5gne
---

Set up the application shell with sidebar layout and base routes.

## Acceptance Criteria
- Root layout at `app/routes/__root.tsx` with auth check
- Index route redirects to `/workdirs`
- Layout component with sidebar structure
- Routes scaffolded:
  - `/workdirs` - Workdir list
  - `/workdirs/:id` - Workdir detail
  - `/workdirs/:id/chats/:chatId` - Chat view

## Component Structure
```
Layout
├── Sidebar (collapsible)
│   ├── WorkdirList
│   └── ChatList (when workdir selected)
└── Main content area
```