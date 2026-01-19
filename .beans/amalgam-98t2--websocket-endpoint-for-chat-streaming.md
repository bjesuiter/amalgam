---
# amalgam-98t2
title: WebSocket endpoint for chat streaming
status: completed
type: task
priority: high
created_at: 2026-01-19T10:53:33Z
updated_at: 2026-01-19T14:58:57Z
parent: amalgam-7u0f
---

WebSocket endpoint for real-time chat communication with OpenCode.

## Acceptance Criteria
- WebSocket route at `/api/chats/:id/stream`
- Bidirectional communication
- Client messages: `message`, `cancel`
- Server messages: `output`, `status`, `error`
- Connect to OpenCode via ACP
- Handle connection lifecycle

## Protocol
```typescript
// Client → Server
{ type: 'message', content: string }
{ type: 'cancel' }

// Server → Client
{ type: 'output', content: string }
{ type: 'status', status: 'running' | 'idle' | 'error' }
{ type: 'error', message: string }
```

## Notes
- Start OpenCode session on first message if not running
- Update chat lastActivityAt on each message
- Forward ACP responses to WebSocket client

## Verification
- Write integration tests with `bun:test` using WebSocket client
- Test cases: connect, send message, receive response, cancel, disconnect
- Mock ACP client for predictable responses
- Test error scenarios (invalid chat ID, connection drops)