---
# amalgam-ypt8
title: ACP protocol client implementation
status: completed
type: task
priority: high
created_at: 2026-01-19T10:53:29Z
updated_at: 2026-01-19T14:53:35Z
parent: amalgam-7u0f
---

Implement ACP (Agent Control Protocol) client for communicating with OpenCode.

## Acceptance Criteria
- Module at `app/server/opencode/acp.ts`
- Initialize ACP session over stdio
- Send user messages (prompt turns)
- Receive streamed responses
- Handle tool calls and confirmations
- Parse content types (text, tool_use, tool_result)

## References
- See `docs/acp/protocol/` for full specification
- See `docs/acp/libraries/typescript.md` for TypeScript library
- Key files:
  - session-setup.md - Initialization
  - prompt-turn.md - Message flow
  - tool-calls.md - Tool handling
  - content.md - Content types
  - transports.md - stdio transport

## Key ACP Messages
- `session/initialize` - Start session
- `prompt/start` - Begin prompt turn
- `prompt/response` - Receive response chunks
- `tool/confirm` - Approve tool execution

## Verification
- Write unit tests with `bun:test`
- Mock stdio streams for isolated testing
- Test cases:
  - Initialize session sends correct JSON-RPC message
  - Prompt start/response parsing works correctly
  - Tool call detection and confirmation flow
  - Content type parsing (text, tool_use, tool_result)
- Integration test with actual OpenCode process (if available in test environment)
- Manual validation: send real prompts and verify responses