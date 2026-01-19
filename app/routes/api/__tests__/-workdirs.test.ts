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

describe('GET /api/workdirs', () => {
  test('returns empty list when no workdirs', async () => {
    const userId = 'user-empty'
    await createTestUser(userId, 'empty@example.com')

    const workdirs = await testDb
      .select()
      .from(schema.workdirs)
      .where(eq(schema.workdirs.userId, userId))

    expect(workdirs).toHaveLength(0)
  })

  test('returns workdirs for the authenticated user only', async () => {
    const user1Id = 'user-1'
    const user2Id = 'user-2'
    await createTestUser(user1Id, 'user1@example.com')
    await createTestUser(user2Id, 'user2@example.com')

    await testDb.insert(schema.workdirs).values([
      {
        id: 'workdir-1',
        userId: user1Id,
        name: 'project-1',
        remotePath: `./data/${user1Id}/workdirs/project-1`,
        createdAt: new Date(),
      },
      {
        id: 'workdir-2',
        userId: user2Id,
        name: 'project-2',
        remotePath: `./data/${user2Id}/workdirs/project-2`,
        createdAt: new Date(),
      },
    ])

    const user1Workdirs = await testDb
      .select()
      .from(schema.workdirs)
      .where(eq(schema.workdirs.userId, user1Id))

    expect(user1Workdirs).toHaveLength(1)
    expect(user1Workdirs[0].name).toBe('project-1')
  })
})

describe('POST /api/workdirs', () => {
  test('creates workdir with correct remote path', async () => {
    const userId = 'user-create'
    const workdirName = 'my-project'
    await createTestUser(userId, 'create@example.com')

    const workdirId = crypto.randomUUID()
    const remotePath = `./data/${userId}/workdirs/${workdirName}`
    const now = new Date()

    await testDb.insert(schema.workdirs).values({
      id: workdirId,
      userId,
      name: workdirName,
      remotePath,
      createdAt: now,
    })

    const workdirs = await testDb
      .select()
      .from(schema.workdirs)
      .where(eq(schema.workdirs.id, workdirId))

    expect(workdirs).toHaveLength(1)
    expect(workdirs[0].name).toBe(workdirName)
    expect(workdirs[0].remotePath).toBe(remotePath)
    expect(workdirs[0].userId).toBe(userId)
  })

  test('lastSyncedAt is null on creation', async () => {
    const userId = 'user-sync-null'
    await createTestUser(userId, 'sync@example.com')

    const workdirId = crypto.randomUUID()
    await testDb.insert(schema.workdirs).values({
      id: workdirId,
      userId,
      name: 'sync-project',
      remotePath: `./data/${userId}/workdirs/sync-project`,
      createdAt: new Date(),
    })

    const workdirs = await testDb
      .select()
      .from(schema.workdirs)
      .where(eq(schema.workdirs.id, workdirId))

    expect(workdirs[0].lastSyncedAt).toBeNull()
  })
})

describe('DELETE /api/workdirs/:id', () => {
  test('deletes workdir that belongs to user', async () => {
    const userId = 'user-delete'
    const workdirId = 'workdir-to-delete'
    await createTestUser(userId, 'delete@example.com')

    await testDb.insert(schema.workdirs).values({
      id: workdirId,
      userId,
      name: 'delete-me',
      remotePath: `./data/${userId}/workdirs/delete-me`,
      createdAt: new Date(),
    })

    await testDb
      .delete(schema.workdirs)
      .where(and(eq(schema.workdirs.id, workdirId), eq(schema.workdirs.userId, userId)))

    const remaining = await testDb
      .select()
      .from(schema.workdirs)
      .where(eq(schema.workdirs.id, workdirId))

    expect(remaining).toHaveLength(0)
  })

  test('does not delete workdir belonging to other user', async () => {
    const user1Id = 'user-owner'
    const user2Id = 'user-attacker'
    const workdirId = 'protected-workdir'
    await createTestUser(user1Id, 'owner@example.com')
    await createTestUser(user2Id, 'attacker@example.com')

    await testDb.insert(schema.workdirs).values({
      id: workdirId,
      userId: user1Id,
      name: 'protected',
      remotePath: `./data/${user1Id}/workdirs/protected`,
      createdAt: new Date(),
    })

    await testDb
      .delete(schema.workdirs)
      .where(and(eq(schema.workdirs.id, workdirId), eq(schema.workdirs.userId, user2Id)))

    const remaining = await testDb
      .select()
      .from(schema.workdirs)
      .where(eq(schema.workdirs.id, workdirId))

    expect(remaining).toHaveLength(1)
  })

  test('returns empty result for non-existent workdir', async () => {
    const userId = 'user-not-found'
    await createTestUser(userId, 'notfound@example.com')

    const existing = await testDb
      .select()
      .from(schema.workdirs)
      .where(and(eq(schema.workdirs.id, 'non-existent'), eq(schema.workdirs.userId, userId)))

    expect(existing).toHaveLength(0)
  })
})
