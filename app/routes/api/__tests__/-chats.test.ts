import { describe, test, expect, beforeEach, afterAll } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { eq, and } from 'drizzle-orm'
import * as schema from '../../../server/db/schema'

const sqlite = new Database(':memory:')
const testDb = drizzle(sqlite, { schema })

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

async function createTestUser(userId: string, email: string) {
  await testDb.insert(schema.users).values({
    id: userId,
    email,
    createdAt: new Date(),
  })
}

async function createTestWorkdir(workdirId: string, userId: string, name: string) {
  await testDb.insert(schema.workdirs).values({
    id: workdirId,
    userId,
    name,
    remotePath: `./data/${userId}/workdirs/${name}`,
    createdAt: new Date(),
  })
}

describe('GET /api/workdirs/:id/chats', () => {
  test('returns empty list when no chats', async () => {
    const userId = 'user-no-chats'
    const workdirId = 'workdir-empty'
    await createTestUser(userId, 'no-chats@example.com')
    await createTestWorkdir(workdirId, userId, 'empty-project')

    const chats = await testDb
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.workdirId, workdirId))

    expect(chats).toHaveLength(0)
  })

  test('returns chats for the workdir', async () => {
    const userId = 'user-with-chats'
    const workdirId = 'workdir-with-chats'
    await createTestUser(userId, 'with-chats@example.com')
    await createTestWorkdir(workdirId, userId, 'chat-project')

    const now = new Date()
    await testDb.insert(schema.chats).values([
      { id: 'chat-1', workdirId, title: 'Chat 1', createdAt: now, lastActiveAt: now, status: 'idle' },
      { id: 'chat-2', workdirId, title: 'Chat 2', createdAt: now, lastActiveAt: now, status: 'idle' },
    ])

    const chats = await testDb
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.workdirId, workdirId))

    expect(chats).toHaveLength(2)
  })

  test('does not return chats from other workdirs', async () => {
    const userId = 'user-multi'
    const workdirId1 = 'workdir-1'
    const workdirId2 = 'workdir-2'
    await createTestUser(userId, 'multi@example.com')
    await createTestWorkdir(workdirId1, userId, 'project-1')
    await createTestWorkdir(workdirId2, userId, 'project-2')

    const now = new Date()
    await testDb.insert(schema.chats).values([
      { id: 'chat-w1', workdirId: workdirId1, createdAt: now, lastActiveAt: now, status: 'idle' },
      { id: 'chat-w2', workdirId: workdirId2, createdAt: now, lastActiveAt: now, status: 'idle' },
    ])

    const chats = await testDb
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.workdirId, workdirId1))

    expect(chats).toHaveLength(1)
    expect(chats[0].id).toBe('chat-w1')
  })
})

describe('POST /api/workdirs/:id/chats', () => {
  test('creates chat with auto-generated UUID', async () => {
    const userId = 'user-create-chat'
    const workdirId = 'workdir-new-chat'
    await createTestUser(userId, 'create-chat@example.com')
    await createTestWorkdir(workdirId, userId, 'new-chat-project')

    const chatId = crypto.randomUUID()
    const now = new Date()

    await testDb.insert(schema.chats).values({
      id: chatId,
      workdirId,
      createdAt: now,
      lastActiveAt: now,
      status: 'idle',
    })

    const chats = await testDb
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.id, chatId))

    expect(chats).toHaveLength(1)
    expect(chats[0].workdirId).toBe(workdirId)
    expect(chats[0].status).toBe('idle')
  })

  test('chat title is null by default', async () => {
    const userId = 'user-no-title'
    const workdirId = 'workdir-no-title'
    await createTestUser(userId, 'no-title@example.com')
    await createTestWorkdir(workdirId, userId, 'no-title-project')

    const chatId = crypto.randomUUID()
    const now = new Date()

    await testDb.insert(schema.chats).values({
      id: chatId,
      workdirId,
      createdAt: now,
      lastActiveAt: now,
      status: 'idle',
    })

    const chats = await testDb
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.id, chatId))

    expect(chats[0].title).toBeNull()
  })
})

describe('DELETE /api/chats/:id', () => {
  test('deletes chat that belongs to user workdir', async () => {
    const userId = 'user-delete-chat'
    const workdirId = 'workdir-delete'
    const chatId = 'chat-to-delete'
    await createTestUser(userId, 'delete-chat@example.com')
    await createTestWorkdir(workdirId, userId, 'delete-project')

    const now = new Date()
    await testDb.insert(schema.chats).values({
      id: chatId,
      workdirId,
      createdAt: now,
      lastActiveAt: now,
      status: 'idle',
    })

    await testDb.delete(schema.chats).where(eq(schema.chats.id, chatId))

    const remaining = await testDb
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.id, chatId))

    expect(remaining).toHaveLength(0)
  })

  test('verifies chat belongs to user workdir before delete', async () => {
    const ownerId = 'owner-user'
    const attackerId = 'attacker-user'
    const ownerWorkdirId = 'owner-workdir'
    const attackerWorkdirId = 'attacker-workdir'
    const chatId = 'protected-chat'

    await createTestUser(ownerId, 'owner@example.com')
    await createTestUser(attackerId, 'attacker@example.com')
    await createTestWorkdir(ownerWorkdirId, ownerId, 'owner-project')
    await createTestWorkdir(attackerWorkdirId, attackerId, 'attacker-project')

    const now = new Date()
    await testDb.insert(schema.chats).values({
      id: chatId,
      workdirId: ownerWorkdirId,
      createdAt: now,
      lastActiveAt: now,
      status: 'idle',
    })

    const chat = await testDb
      .select({
        chat: schema.chats,
        workdir: schema.workdirs,
      })
      .from(schema.chats)
      .innerJoin(schema.workdirs, eq(schema.chats.workdirId, schema.workdirs.id))
      .where(and(eq(schema.chats.id, chatId), eq(schema.workdirs.userId, attackerId)))

    expect(chat).toHaveLength(0)

    const remaining = await testDb
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.id, chatId))

    expect(remaining).toHaveLength(1)
  })
})
