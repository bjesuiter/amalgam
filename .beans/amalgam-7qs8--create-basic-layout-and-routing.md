---
# amalgam-7qs8
title: Create basic layout and routing
status: completed
type: task
priority: high
tags:
    - ai-verified
created_at: 2026-01-19T10:51:58Z
updated_at: 2026-01-19T15:09:51Z
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

## Verification
- Use `agent-browser` skill to test UI
- Verify: index redirects to /workdirs
- Verify: sidebar renders with correct structure
- Verify: all routes are accessible and render content
- Verify: layout responsive on different viewports

## AI Verification Result (2026-01-19)
**Status: PASSED**
- ✅ Index route redirects to /workdirs (confirmed)
- ✅ Sidebar renders with correct structure (WORKDIRS section, navigation)
- ✅ /workdirs route accessible and renders workdir list
- ✅ /workdirs/:id route shows workdir detail with sync controls
- ✅ /workdirs/:id/chats/:chatId route shows chat view with message input
- ✅ Navigation works both ways (Amalgam link returns to /workdirs)
