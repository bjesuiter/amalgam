---
# amalgam-3pb5
title: Service worker for offline shell
status: todo
type: task
priority: low
created_at: 2026-01-19T10:54:11Z
updated_at: 2026-01-19T10:54:11Z
parent: amalgam-u0rf
---

Implement service worker for offline app shell caching.

## Acceptance Criteria
- Vite PWA plugin configured
- App shell cached for offline access
- Offline indicator when disconnected
- Queue messages when offline (optional)
- Cache static assets

## Scope
- Cache: HTML shell, CSS, JS bundles
- Network-first: API calls
- Show offline message when API unavailable

## Notes
- Keep simple - just cache shell
- Don't cache API responses
- Service worker updates on new deploy