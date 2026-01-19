---
# amalgam-mayp
title: Mobile responsiveness
status: todo
type: task
priority: normal
created_at: 2026-01-19T10:54:08Z
updated_at: 2026-01-19T10:54:08Z
parent: amalgam-u0rf
---

Ensure the application works well on mobile devices.

## Acceptance Criteria
- Responsive sidebar (collapsible on mobile)
- Touch-friendly buttons and inputs
- Readable text sizes
- Proper viewport meta tag
- Chat input works on mobile keyboards
- Test on iOS Safari and Android Chrome

## Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Mobile-specific
- Hamburger menu for sidebar
- Full-screen chat on mobile
- Swipe gestures (optional)

## Verification
- Use `agent-browser` skill with mobile viewport emulation
- Verify: sidebar collapses to hamburger on mobile
- Verify: touch targets are at least 44x44px
- Verify: text is readable without zooming
- Verify: chat input doesn't get hidden by keyboard
- Test at breakpoints: 375px (iPhone), 768px (iPad), 1024px+ (desktop)