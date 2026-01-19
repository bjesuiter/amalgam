---
# amalgam-m2sb
title: Set up TailwindCSS + shadcn/ui
status: todo
type: task
priority: high
created_at: 2026-01-19T10:51:45Z
updated_at: 2026-01-19T10:51:45Z
parent: amalgam-5gne
---

Configure TailwindCSS and install shadcn/ui component library.

## Acceptance Criteria
- TailwindCSS installed and configured
- `tailwind.config.ts` created with custom theme
- shadcn/ui initialized with components directory at `app/components/ui/`
- Base components installed: Button, Input, Dialog, Card

## Technical Notes
- Use `bunx shadcn-ui@latest init`
- Configure path aliases in tsconfig.json

## Verification
- Manual validation (setup task):
  - Tailwind classes apply correctly (check with dev tools)
  - shadcn/ui components render properly
  - `bun run build` completes without CSS errors
- Use `agent-browser` skill to visually verify:
  - Button, Input, Dialog, Card components render correctly
  - Theme colors apply as expected