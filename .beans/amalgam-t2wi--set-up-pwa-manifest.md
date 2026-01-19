---
# amalgam-t2wi
title: Set up PWA manifest
status: todo
type: task
priority: normal
created_at: 2026-01-19T10:52:01Z
updated_at: 2026-01-19T10:52:01Z
parent: amalgam-5gne
---

Configure Progressive Web App manifest for installability.

## Acceptance Criteria
- `public/manifest.json` created with app metadata
- App icons at `public/icons/` (192x192, 512x512)
- Vite PWA plugin configured (optional, can defer service worker)
- Meta tags in root HTML template

## Manifest Content
- name: Amalgam
- short_name: Amalgam
- theme_color: TBD
- background_color: TBD
- display: standalone
- start_url: /