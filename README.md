# Amalgam

An amalgamation of technologies: A web-based coding assistant that bridges local filesystems with cloud-hosted AI.

## Why

Running AI coding assistants locally has friction:
- Constantly granting filesystem permissions
- Managing API keys and rate limits
- No persistence across machines
- Security concerns with full system access

**Amalgam** solves this by:
- Running OpenCode in an isolated exe.dev VM (sandboxed, secure)
- Syncing only the directories you choose via Chrome File System API
- Proxying LLM requests through a central server (one API key, usage tracking)
- Providing a familiar chat UI accessible from any browser

## What

A PWA with a T3-chat-style interface that:

1. **Workdir Management** - Select local folders to sync with the server
2. **File Sync** - Upload/download changes with conflict detection
3. **Chat Interface** - Send prompts to OpenCode running in your synced workdir
4. **Session Persistence** - Chat sessions map 1:1 to OpenCode sessions

### Architecture

```
Browser (PWA)                         exe.dev VM
┌─────────────────┐                  ┌─────────────────────────┐
│ Local Folder    │◄── Chrome FS ──►│ Synced Workdir          │
│                 │                  │   └── OpenCode process  │
│ Amalgam UI      │◄── WebSocket ──►│ TanStack Start Server   │
└─────────────────┘                  └─────────────────────────┘
```

### Tech Stack

- **Frontend**: TanStack Start (React), TailwindCSS
- **Backend**: TanStack Start server functions, SQLite
- **Auth**: exe.dev built-in authentication
- **AI**: OpenCode via ACP protocol
- **Hosting**: exe.dev VM

## Getting Started

See [agent/SPEC.md](agent/SPEC.md) for detailed implementation specification.

## License

MIT
