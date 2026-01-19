---
# amalgam-x0od
title: Debug Sidebar for ACP Commands
status: todo
type: feature
priority: normal
created_at: 2026-01-19T15:57:46Z
updated_at: 2026-01-19T15:57:46Z
---

Add a debug sidebar on the right side of the chat window that displays ACP protocol traffic and session information for debugging purposes.

## Context

The chat page (`app/routes/workdirs/$workdirId/chats/$chatId.tsx`) currently has:
- Left sidebar (`app/components/Sidebar.tsx`) for navigation
- Main content area for chat messages
- Delete button (Trash2 icon) in the header at line 244-250

The ACP layer (`app/server/opencode/`) provides:
- JSON-RPC requests/responses via `acp.ts`
- Session management via `manager.ts` with subprocess PID available
- Event streaming via `chat.ts`

## Requirements

### Frontend (DebugSidebar component)

Create `app/components/DebugSidebar.tsx`:
- Panel on the RIGHT side of the chat content (not replacing the navigation sidebar)
- Collapsible with smooth animation (similar to existing Sidebar collapse pattern)
- Default state: OPEN when in dev mode, CLOSED in production
- Width: ~350-400px when expanded

### Content to Display

1. **Session Info Section**
   - Subprocess PID (from OpenCode process)
   - ACP Session ID
   - Connection status (connected/disconnected)
   - Workdir path

2. **ACP Traffic Log Section**
   - Scrollable list of ACP commands/responses
   - Each entry shows:
     - Timestamp
     - Direction indicator (→ sent, ← received)
     - Method name (e.g., "session/prompt", "initialize")
     - Collapsible JSON payload (pretty-printed)
   - Color coding: requests (blue), responses (green), errors (red)
   - Max ~100 entries with auto-scroll to latest

3. **Error Section**
   - List of recent errors from ACP communication
   - Error message + stack trace if available

### Data Flow

1. Backend needs to expose debug events via new SSE event type or dedicated endpoint
2. Add new event types to chat stream: `debug_request`, `debug_response`, `debug_error`
3. Frontend subscribes to these events and populates the sidebar

### Dev Mode Detection

Add dev mode detection:
- Check for `import.meta.env.DEV` (Vite pattern) or similar
- Create utility: `app/lib/devMode.ts` with `isDevMode()` function
- Sidebar visibility default depends on this

### Layout Changes

Modify `app/routes/workdirs/$workdirId/chats/$chatId.tsx`:
- Wrap chat content + debug sidebar in flex container
- Chat content should shrink when sidebar is open

## Checklist

- [ ] Create `app/lib/devMode.ts` with isDevMode() helper
- [ ] Create debug event types in `app/server/opencode/chat.ts`
- [ ] Add ACP request/response logging to `app/server/opencode/acp.ts`
- [ ] Create `app/components/DebugSidebar.tsx` component
- [ ] Add debug data state management in chat page
- [ ] Update chat page layout for right sidebar
- [ ] Style the sidebar with appropriate colors and scrolling
- [ ] Test that sidebar auto-opens in dev, stays closed in prod