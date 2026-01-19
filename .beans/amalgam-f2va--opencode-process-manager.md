---
# amalgam-f2va
title: OpenCode process manager
status: todo
type: task
priority: high
created_at: 2026-01-19T10:53:23Z
updated_at: 2026-01-19T10:53:23Z
parent: amalgam-7u0f
---

Server-side process manager for spawning and managing OpenCode instances.

## Acceptance Criteria
- Module at `app/server/opencode/manager.ts`
- `startSession(chatId, workdir)` - Spawns OpenCode process
- `stopSession(chatId)` - Kills process
- `getSession(chatId)` - Returns session info
- Track sessions in memory Map
- Handle process exit events

## Interface
```typescript
interface OpenCodeSession {
  chatId: string;
  process: ChildProcess;
  workdir: string;
  startedAt: Date;
  lastActivityAt: Date;
}
```

## Notes
- Spawn with `opencode --acp` flag
- Set CWD to workdir remote path
- Kill existing session before starting new one