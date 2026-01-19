---
# amalgam-b3cl
title: Session timeout handling
status: todo
type: task
priority: normal
created_at: 2026-01-19T10:53:47Z
updated_at: 2026-01-19T10:53:47Z
parent: amalgam-7u0f
---

Automatically clean up idle OpenCode sessions after timeout.

## Acceptance Criteria
- Sessions timeout after 30 minutes of inactivity
- Periodic cleanup interval (every 60 seconds)
- Update lastActivityAt on each message
- Notify connected WebSocket clients on timeout
- Graceful process termination

## Configuration
- SESSION_TIMEOUT_MS = 30 * 60 * 1000 (30 minutes)
- Configurable via environment variable

## Cleanup Logic
```typescript
setInterval(() => {
  const now = Date.now();
  for (const [chatId, session] of sessions) {
    if (now - session.lastActivityAt.getTime() > SESSION_TIMEOUT_MS) {
      stopSession(chatId);
    }
  }
}, 60 * 1000);
```