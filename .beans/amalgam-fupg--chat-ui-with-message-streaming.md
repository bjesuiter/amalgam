---
# amalgam-fupg
title: Chat UI with message streaming
status: todo
type: task
priority: high
created_at: 2026-01-19T10:53:40Z
updated_at: 2026-01-19T10:53:40Z
parent: amalgam-7u0f
---

User interface for chat interactions with streaming message display.

## Acceptance Criteria
- ChatPage at `/workdirs/:id/chats/:chatId`
- ChatHeader showing status (idle/running/error) and title
- MessageList with ChatMessage components
- ChatInput for user messages
- Real-time streaming via WebSocket
- Auto-scroll to latest message
- Markdown rendering for assistant messages

## Components
- `app/components/ChatMessage.tsx`
- `app/components/ChatInput.tsx`
- `app/components/ChatList.tsx`
- `app/routes/workdirs/$workdirId/chats/$chatId.tsx`

## Styling
- User messages: right-aligned, blue background
- Assistant messages: left-aligned, gray background
- Streaming indicator during response