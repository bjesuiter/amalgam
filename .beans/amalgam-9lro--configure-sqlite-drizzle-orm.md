---
# amalgam-9lro
title: Configure SQLite + Drizzle ORM
status: todo
type: task
priority: high
created_at: 2026-01-19T10:51:51Z
updated_at: 2026-01-19T10:51:51Z
parent: amalgam-5gne
---

Set up SQLite database with Drizzle ORM for type-safe database access.

## Acceptance Criteria
- SQLite database file at `data/amalgam.db`
- Drizzle ORM configured with schema at `app/server/db/schema.ts`
- Database client at `app/server/db/index.ts`
- Initial migration generated
- `drizzle.config.ts` created

## Schema (from SPEC.md)
```typescript
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // X-ExeDev-UserID
  email: text('email').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const workdirs = sqliteTable('workdirs', {
  id: text('id').primaryKey(), // uuid
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  remotePath: text('remote_path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
});

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(), // uuid
  workdirId: text('workdir_id').notNull().references(() => workdirs.id),
  title: text('title'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['idle', 'running', 'error'] }).notNull().default('idle'),
});
```