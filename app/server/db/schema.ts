import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const workdirs = sqliteTable('workdirs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  remotePath: text('remote_path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
})

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  workdirId: text('workdir_id')
    .notNull()
    .references(() => workdirs.id),
  title: text('title'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['idle', 'running', 'error'] })
    .notNull()
    .default('idle'),
})
