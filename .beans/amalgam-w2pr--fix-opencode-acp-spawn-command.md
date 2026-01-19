---
# amalgam-w2pr
title: Fix OpenCode ACP spawn command
status: completed
type: bug
created_at: 2026-01-19T15:37:29Z
updated_at: 2026-01-19T15:37:29Z
---

The OpenCode process manager was using 'opencode --acp' but the correct command is 'opencode acp' (subcommand). This caused JSON-RPC parsing errors when trying to chat.