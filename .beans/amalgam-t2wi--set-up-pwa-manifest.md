---
# amalgam-t2wi
title: Set up PWA manifest
status: completed
type: task
priority: normal
created_at: 2026-01-19T10:52:01Z
updated_at: 2026-01-19T18:35:52Z
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

## Verification
- Manual validation:
  - `public/manifest.json` exists and is valid JSON
  - Icons exist at specified paths
  - Meta tags present in HTML head
- Use `agent-browser` skill:
  - Open Chrome DevTools → Application → Manifest
  - Verify manifest loads without errors
  - Check "Add to Home Screen" prompt available