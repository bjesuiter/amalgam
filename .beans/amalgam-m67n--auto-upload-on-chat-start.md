---
# amalgam-m67n
title: Auto-upload on chat start
status: todo
type: task
priority: normal
created_at: 2026-01-19T10:53:43Z
updated_at: 2026-01-19T10:53:43Z
parent: amalgam-7u0f
---

Automatically sync files before starting a chat session.

## Acceptance Criteria
- Prompt user to sync before first message if files changed
- Option to skip sync
- Show sync progress before chat starts
- Only prompt if local changes detected

## Flow
1. User sends first message in chat
2. Check if local manifest differs from remote
3. If changes detected, show 'Sync required' dialog
4. User can: Sync now, Skip, Cancel
5. If syncing, upload changes then send message
6. If skipping, send message with current remote state