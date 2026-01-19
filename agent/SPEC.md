# Amalgam - Technical Specification

This document describes HOW to build Amalgam. For WHY and WHAT, see [README.md](../README.md).

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Data Model](#data-model)
3. [Authentication](#authentication)
4. [API Routes](#api-routes)
5. [File Sync](#file-sync)
6. [OpenCode Integration](#opencode-integration)
7. [UI Structure](#ui-structure)
8. [Project Structure](#project-structure)
9. [Implementation Phases](#implementation-phases)
10. [Design Decisions](#design-decisions)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | TanStack Start (React) | Full-stack framework with SSR/SPA support |
| Styling | TailwindCSS | Utility-first CSS |
| UI Components | shadcn/ui | Accessible, customizable components |
| Database | SQLite + Drizzle ORM | Lightweight, file-based, type-safe |
| Auth | exe.dev built-in | Via `X-ExeDev-*` headers |
| File Sync | Chrome File System Access API | Browser-native directory access |
| AI Engine | OpenCode | Via ACP protocol |
| Hosting | exe.dev VM | Persistent disk, HTTPS proxy, built-in auth |
| PWA | Vite PWA plugin | Service worker, manifest |

---

## Data Model

### Database Schema (Drizzle)

```typescript
// db/schema.ts

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // X-ExeDev-UserID
  email: text('email').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const workdirs = sqliteTable('workdirs', {
  id: text('id').primaryKey(), // uuid
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  remotePath: text('remote_path').notNull(), // /home/exedev/<userId>/<name>
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
});

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(), // uuid
  workdirId: text('workdir_id').notNull().references(() => workdirs.id),
  title: text('title'), // Optional, auto-generated from first message
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['idle', 'running', 'error'] }).notNull().default('idle'),
});
```

### Client-Side Storage (IndexedDB)

Chrome File System API handles (`FileSystemDirectoryHandle`) cannot be serialized to JSON. Store them in IndexedDB:

```typescript
// lib/fs-storage.ts

interface WorkdirHandle {
  workdirId: string;
  handle: FileSystemDirectoryHandle;
  lastAccessedAt: number;
}

// Use idb-keyval or similar for simple key-value storage
// Key: workdirId, Value: FileSystemDirectoryHandle
```

### File Manifest (Runtime, not persisted)

```typescript
interface FileManifest {
  path: string;      // Relative path from workdir root
  size: number;      // Bytes
  mtime: number;     // Unix timestamp (milliseconds)
}

interface SyncManifest {
  local: FileManifest[];
  remote: FileManifest[];
}
```

---

## Authentication

exe.dev provides authentication via HTTP headers. All requests proxied through `https://vmname.exe.xyz/` include:

- `X-ExeDev-UserID`: Stable, unique user identifier
- `X-ExeDev-Email`: User's email address

### Auth Middleware

```typescript
// server/middleware/auth.ts

import { createMiddleware } from '@tanstack/start';

export const authMiddleware = createMiddleware().server(async ({ request, next }) => {
  const userId = request.headers.get('X-ExeDev-UserID');
  const email = request.headers.get('X-ExeDev-Email');

  if (!userId || !email) {
    // Redirect to exe.dev login
    return new Response(null, {
      status: 302,
      headers: { Location: '/__exe.dev/login?redirect=' + encodeURIComponent(request.url) },
    });
  }

  // Upsert user in database
  await upsertUser({ id: userId, email });

  return next({
    context: { userId, email },
  });
});
```

---

## API Routes

### Workdirs

```
GET    /api/workdirs
       → Returns: { workdirs: Workdir[] }

POST   /api/workdirs
       Body: { name: string }
       → Creates workdir, creates remote directory
       → Returns: { workdir: Workdir }

DELETE /api/workdirs/:id
       Query: { deleteFiles?: boolean }
       → Deletes workdir record, optionally deletes remote files
       → Returns: { success: boolean }
```

### File Sync

```
GET    /api/workdirs/:id/manifest
       → Scans remote directory
       → Returns: { files: FileManifest[] }

POST   /api/workdirs/:id/upload
       Body: FormData with files (path as key, file as value)
       → Writes files to remote directory
       → Returns: { uploaded: string[], failed: string[] }

GET    /api/workdirs/:id/download
       Query: { paths: string[] } (comma-separated)
       → Returns: Streamed zip file or multipart response
```

### Chats

```
GET    /api/workdirs/:id/chats
       → Returns: { chats: Chat[] }

POST   /api/workdirs/:id/chats
       → Creates new chat
       → Returns: { chat: Chat }

DELETE /api/chats/:id
       → Kills OpenCode process if running, deletes chat
       → Returns: { success: boolean }
```

### OpenCode Streaming

```
WebSocket /api/chats/:id/stream

Client → Server messages:
  { type: 'message', content: string }
  { type: 'cancel' }

Server → Client messages:
  { type: 'output', content: string }
  { type: 'status', status: 'running' | 'idle' | 'error' }
  { type: 'error', message: string }
```

---

## File Sync

### Ignored Files

Default ignore patterns (configurable per workdir):

```
node_modules/
.git/
.DS_Store
*.log
.env
.env.*
dist/
build/
.cache/
.amalgam/
```

### Upload Flow

```
1. User clicks "Upload"
2. Client checks if FileSystemDirectoryHandle is still valid
   - If not, prompt user to re-select directory
3. Client recursively reads local directory (respecting ignore patterns)
4. Client builds local manifest: { path, size, mtime }[]
5. Client fetches remote manifest: GET /api/workdirs/:id/manifest
6. Client computes diff:
   - newFiles: files in local but not remote
   - changedFiles: files in both with different size OR mtime
   - unchangedFiles: files in both with same size AND mtime
   - deletedFiles: files in remote but not local (warn only, don't auto-delete)
7. If changedFiles exist where remote is also different from last sync:
   - Show conflict dialog: "These files have changed both locally and remotely"
   - Options: "Overwrite remote", "Skip these files", "Cancel"
8. Client uploads files via POST /api/workdirs/:id/upload
   - Use chunked upload for files > 5MB
9. Update lastSyncedAt timestamp
```

### Download Flow

```
1. User clicks "Download"
2. Client checks if FileSystemDirectoryHandle is still valid
3. Client builds local manifest
4. Client fetches remote manifest
5. Client computes diff (same as upload, but reversed)
6. If changedFiles exist where local is also different:
   - Show conflict dialog
   - Options: "Overwrite local", "Skip these files", "Cancel"
7. Client downloads files via GET /api/workdirs/:id/download
8. Client writes files to local directory via Chrome FS API
9. Update lastSyncedAt timestamp
```

### Chrome File System API Usage

```typescript
// lib/fs-api.ts

export async function selectDirectory(): Promise<FileSystemDirectoryHandle> {
  return await window.showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'documents',
  });
}

export async function readDirectoryRecursive(
  handle: FileSystemDirectoryHandle,
  basePath = ''
): Promise<FileManifest[]> {
  const files: FileManifest[] = [];
  
  for await (const [name, entry] of handle.entries()) {
    const path = basePath ? `${basePath}/${name}` : name;
    
    if (shouldIgnore(path)) continue;
    
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      files.push({
        path,
        size: file.size,
        mtime: file.lastModified,
      });
    } else if (entry.kind === 'directory') {
      const subFiles = await readDirectoryRecursive(entry, path);
      files.push(...subFiles);
    }
  }
  
  return files;
}

export async function writeFile(
  rootHandle: FileSystemDirectoryHandle,
  path: string,
  content: Blob
): Promise<void> {
  const parts = path.split('/');
  const fileName = parts.pop()!;
  
  let currentHandle = rootHandle;
  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
  }
  
  const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
```

---

## OpenCode Integration

### Process Manager

```typescript
// server/opencode/manager.ts

interface OpenCodeSession {
  chatId: string;
  process: ChildProcess;
  workdir: string;
  startedAt: Date;
  lastActivityAt: Date;
}

const sessions = new Map<string, OpenCodeSession>();

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export async function startSession(chatId: string, workdir: string): Promise<void> {
  // Kill existing session if any
  await stopSession(chatId);
  
  const process = spawn('opencode', ['--acp'], {
    cwd: workdir,
    env: {
      ...process.env,
      // Add any required env vars for OpenCode
    },
  });
  
  sessions.set(chatId, {
    chatId,
    process,
    workdir,
    startedAt: new Date(),
    lastActivityAt: new Date(),
  });
  
  // Set up process event handlers
  process.on('exit', (code) => {
    sessions.delete(chatId);
    // Notify connected clients
  });
}

export async function stopSession(chatId: string): Promise<void> {
  const session = sessions.get(chatId);
  if (session) {
    session.process.kill();
    sessions.delete(chatId);
  }
}

export function getSession(chatId: string): OpenCodeSession | undefined {
  return sessions.get(chatId);
}

// Cleanup idle sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [chatId, session] of sessions) {
    if (now - session.lastActivityAt.getTime() > SESSION_TIMEOUT_MS) {
      stopSession(chatId);
    }
  }
}, 60 * 1000);
```

### ACP Protocol Integration

> **Documentation**: See `docs/acp/` for full protocol specification.

Key integration points (refer to `docs/acp/protocol/` for details):

- **Session Setup** (`session-setup.md`): Initialize ACP session with OpenCode
- **Prompt Turn** (`prompt-turn.md`): Sending user messages and receiving responses
- **Tool Calls** (`tool-calls.md`): Handling tool execution and confirmations
- **Content** (`content.md`): Message content types and streaming
- **Transports** (`transports.md`): stdio transport for process communication

TypeScript client library available: see `docs/acp/libraries/typescript.md`

---

## UI Structure

### Routes

```
/                           → Redirect to /workdirs
/workdirs                   → Workdir list + create dialog
/workdirs/:id               → Workdir detail: file tree, chat list, sync buttons
/workdirs/:id/chats/:chatId → Chat view (main interface)
```

### Component Hierarchy

```
App
├── Layout
│   ├── Sidebar
│   │   ├── WorkdirList
│   │   └── ChatList (when workdir selected)
│   └── Main
│       ├── WorkdirsPage
│       │   ├── WorkdirCard[]
│       │   └── CreateWorkdirDialog
│       ├── WorkdirDetailPage
│       │   ├── SyncControls (Upload/Download buttons)
│       │   ├── FileTree (optional, shows synced files)
│       │   └── ChatList
│       └── ChatPage
│           ├── ChatHeader (status, title)
│           ├── MessageList
│           │   └── ChatMessage[]
│           └── ChatInput
└── Dialogs
    ├── ConflictDialog
    ├── CreateWorkdirDialog
    └── ConfirmDeleteDialog
```

### Key Components

#### SyncControls

```tsx
function SyncControls({ workdirId }: { workdirId: string }) {
  const [syncing, setSyncing] = useState<'upload' | 'download' | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[] | null>(null);

  return (
    <div className="flex gap-2">
      <Button onClick={handleUpload} disabled={!!syncing}>
        {syncing === 'upload' ? <Spinner /> : <UploadIcon />}
        Upload
      </Button>
      <Button onClick={handleDownload} disabled={!!syncing}>
        {syncing === 'download' ? <Spinner /> : <DownloadIcon />}
        Download
      </Button>
      
      {conflicts && (
        <ConflictDialog
          conflicts={conflicts}
          onResolve={handleResolve}
          onCancel={() => setConflicts(null)}
        />
      )}
    </div>
  );
}
```

#### ChatMessage

```tsx
function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={cn(
      'p-4 rounded-lg',
      message.role === 'user' ? 'bg-blue-100 ml-12' : 'bg-gray-100 mr-12'
    )}>
      {message.role === 'assistant' ? (
        <Markdown>{message.content}</Markdown>
      ) : (
        <p>{message.content}</p>
      )}
    </div>
  );
}
```

---

## Project Structure

```
amalgam/
├── app/
│   ├── routes/
│   │   ├── __root.tsx              # Root layout with auth check
│   │   ├── index.tsx               # Redirect to /workdirs
│   │   ├── workdirs/
│   │   │   ├── index.tsx           # Workdir list
│   │   │   └── $workdirId/
│   │   │       ├── index.tsx       # Workdir detail
│   │   │       └── chats/
│   │   │           └── $chatId.tsx # Chat view
│   │   └── api/
│   │       ├── workdirs.ts         # Workdir CRUD
│   │       ├── workdirs.$id.ts     # Single workdir operations
│   │       ├── workdirs.$id.manifest.ts
│   │       ├── workdirs.$id.upload.ts
│   │       ├── workdirs.$id.download.ts
│   │       ├── workdirs.$id.chats.ts
│   │       └── chats.$id.ts
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatList.tsx
│   │   ├── WorkdirCard.tsx
│   │   ├── WorkdirList.tsx
│   │   ├── SyncControls.tsx
│   │   ├── FileTree.tsx
│   │   ├── ConflictDialog.tsx
│   │   └── Layout.tsx
│   ├── lib/
│   │   ├── fs-api.ts               # Chrome File System API wrapper
│   │   ├── fs-storage.ts           # IndexedDB for directory handles
│   │   ├── sync.ts                 # Sync logic (manifest, diff)
│   │   ├── ignore.ts               # File ignore patterns
│   │   └── utils.ts                # General utilities
│   └── server/
│       ├── middleware/
│       │   └── auth.ts             # exe.dev auth middleware
│       ├── db/
│       │   ├── index.ts            # Drizzle client
│       │   └── schema.ts           # Database schema
│       └── opencode/
│           ├── manager.ts          # Process lifecycle
│           └── acp.ts              # ACP protocol client (TBD)
├── drizzle/
│   └── migrations/                 # Database migrations
├── public/
│   ├── manifest.json               # PWA manifest
│   └── icons/                      # App icons
├── Dockerfile                      # For exe.dev deployment
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── drizzle.config.ts
└── app.config.ts                   # TanStack Start config
```

---

## Implementation Phases

### Phase 1: Foundation (Est: 2-3 days)

- [ ] Initialize TanStack Start project
- [ ] Set up TailwindCSS + shadcn/ui
- [ ] Configure SQLite + Drizzle
- [ ] Implement exe.dev auth middleware
- [ ] Create basic layout and routing
- [ ] Set up PWA manifest

### Phase 2: Workdir Management (Est: 2-3 days)

- [ ] Chrome File System API wrapper
- [ ] IndexedDB for storing directory handles
- [ ] Workdir CRUD API routes
- [ ] Workdir list and detail UI
- [ ] Create workdir dialog with folder selection

### Phase 3: File Sync (Est: 3-4 days)

- [ ] Local manifest building
- [ ] Remote manifest API
- [ ] Diff computation with conflict detection
- [ ] Upload endpoint (multipart, chunked for large files)
- [ ] Download endpoint (zip or stream)
- [ ] Sync UI with progress and conflict dialogs
- [ ] Ignore patterns implementation

### Phase 4: OpenCode Integration (Est: 3-5 days)

- [ ] Process manager (spawn, kill, restart)
- [ ] ACP protocol client implementation
- [ ] WebSocket endpoint for chat streaming
- [ ] Chat CRUD API routes
- [ ] Chat UI with message streaming
- [ ] Auto-upload on chat start
- [ ] Session timeout handling

### Phase 5: Polish (Est: 2-3 days)

- [ ] Error handling and user feedback
- [ ] Loading states and skeletons
- [ ] Mobile responsiveness
- [ ] Service worker for offline shell
- [ ] Dockerfile and deployment config
- [ ] Testing on exe.dev

---

## Design Decisions

### Why TanStack Start?

- Full-stack React framework with excellent DX
- Built-in file-based routing
- Server functions for type-safe API calls
- Good SSR support for initial load
- Growing ecosystem (TanStack Query, Router, etc.)

### Why SQLite?

- No external database to manage
- Persistent on exe.dev disk
- Fast for single-user workloads
- Easy backups (just copy the file)
- Drizzle provides excellent type safety

### Why Chrome File System API (not drag-drop)?

- Persistent access (with user permission)
- Full directory access, not just single files
- Can read/write without re-selecting
- Better UX for repeated syncs
- Limitation: Chrome/Edge only (acceptable for personal tool)

### Why exe.dev?

- Built-in auth eliminates password/OAuth complexity
- Persistent VM with disk (not serverless)
- HTTPS proxy with auto TLS
- Easy sharing if needed later
- Good fit for running OpenCode (needs persistent process)

### Why not store chat messages?

- OpenCode sessions ARE the chat history
- Avoids sync complexity
- Reduces storage requirements
- OpenCode may have its own persistence

### Session Timeout: 30 minutes

- Balances resource usage vs convenience
- User can always restart session by sending a message
- Configurable per deployment if needed

---

## Open Questions

1. ~~**ACP Protocol Details**~~ - ✅ Resolved: See `docs/acp/`
2. **Multi-tab handling** - Should we use BroadcastChannel to prevent conflicts?
3. **Large workdir limits** - What's the max size before we warn/block?
4. **Git integration** - Should we respect `.gitignore` automatically?
