import { describe, test, expect, beforeEach, afterAll } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { eq } from 'drizzle-orm'
import * as schema from '../schema'

const sqlite = new Database(':memory:')
const db = drizzle(sqlite, { schema })

beforeEach(() => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workdirs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      remote_path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_synced_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      workdir_id TEXT NOT NULL REFERENCES workdirs(id),
      title TEXT,
      created_at INTEGER NOT NULL,
      last_active_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle'
    );
    DELETE FROM chats;
    DELETE FROM workdirs;
    DELETE FROM users;
  `)
})

afterAll(() => {
  sqlite.close()
})

describe('Database Schema', () => {
  test('create user and verify in database', async () => {
    const userId = 'user-123'
    const email = 'test@example.com'
    const now = new Date()

    await db.insert(schema.users).values({
      id: userId,
      email,
      createdAt: now,
    })

    const users = await db.select().from(schema.users).where(eq(schema.users.id, userId))
    expect(users).toHaveLength(1)
    expect(users[0].id).toBe(userId)
    expect(users[0].email).toBe(email)
    expect(Math.floor(users[0].createdAt.getTime() / 1000)).toBe(Math.floor(now.getTime() / 1000))
  })

  test('create workdir with user reference', async () => {
    const userId = 'user-456'
    const workdirId = 'workdir-123'
    const now = new Date()

    await db.insert(schema.users).values({
      id: userId,
      email: 'workdir-test@example.com',
      createdAt: now,
    })

    await db.insert(schema.workdirs).values({
      id: workdirId,
      userId,
      name: 'My Project',
      remotePath: '/home/user/projects/my-project',
      createdAt: now,
    })

    const workdirs = await db.select().from(schema.workdirs).where(eq(schema.workdirs.id, workdirId))
    expect(workdirs).toHaveLength(1)
    expect(workdirs[0].userId).toBe(userId)
    expect(workdirs[0].name).toBe('My Project')
    expect(workdirs[0].remotePath).toBe('/home/user/projects/my-project')
    expect(workdirs[0].lastSyncedAt).toBeNull()
  })

  test('create chat with workdir reference', async () => {
    const userId = 'user-789'
    const workdirId = 'workdir-456'
    const chatId = 'chat-123'
    const now = new Date()

    await db.insert(schema.users).values({
      id: userId,
      email: 'chat-test@example.com',
      createdAt: now,
    })

    await db.insert(schema.workdirs).values({
      id: workdirId,
      userId,
      name: 'Chat Project',
      remotePath: '/home/user/chat-project',
      createdAt: now,
    })

    await db.insert(schema.chats).values({
      id: chatId,
      workdirId,
      title: 'Test Chat',
      createdAt: now,
      lastActiveAt: now,
      status: 'idle',
    })

    const chats = await db.select().from(schema.chats).where(eq(schema.chats.id, chatId))
    expect(chats).toHaveLength(1)
    expect(chats[0].workdirId).toBe(workdirId)
    expect(chats[0].title).toBe('Test Chat')
    expect(chats[0].status).toBe('idle')
  })

  test('chat status enum values', async () => {
    const userId = 'user-enum'
    const workdirId = 'workdir-enum'
    const now = new Date()

    await db.insert(schema.users).values({
      id: userId,
      email: 'enum-test@example.com',
      createdAt: now,
    })

    await db.insert(schema.workdirs).values({
      id: workdirId,
      userId,
      name: 'Enum Project',
      remotePath: '/home/user/enum-project',
      createdAt: now,
    })

    const statuses = ['idle', 'running', 'error'] as const
    for (const status of statuses) {
      const chatId = `chat-${status}`
      await db.insert(schema.chats).values({
        id: chatId,
        workdirId,
        createdAt: now,
        lastActiveAt: now,
        status,
      })

      const chat = await db.select().from(schema.chats).where(eq(schema.chats.id, chatId))
      expect(chat[0].status).toBe(status)
    }
  })

  test('workdir lastSyncedAt can be updated', async () => {
    const userId = 'user-sync'
    const workdirId = 'workdir-sync'
    const now = new Date()

    await db.insert(schema.users).values({
      id: userId,
      email: 'sync-test@example.com',
      createdAt: now,
    })

    await db.insert(schema.workdirs).values({
      id: workdirId,
      userId,
      name: 'Sync Project',
      remotePath: '/home/user/sync-project',
      createdAt: now,
    })

    let workdir = await db.select().from(schema.workdirs).where(eq(schema.workdirs.id, workdirId))
    expect(workdir[0].lastSyncedAt).toBeNull()

    const syncTime = new Date()
    await db
      .update(schema.workdirs)
      .set({ lastSyncedAt: syncTime })
      .where(eq(schema.workdirs.id, workdirId))

    workdir = await db.select().from(schema.workdirs).where(eq(schema.workdirs.id, workdirId))
    expect(Math.floor(workdir[0].lastSyncedAt!.getTime() / 1000)).toBe(Math.floor(syncTime.getTime() / 1000))
  })
})
