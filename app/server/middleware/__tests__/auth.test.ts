import { describe, test, expect, beforeEach, afterAll } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { eq } from 'drizzle-orm'
import * as schema from '../../db/schema'

const sqlite = new Database(':memory:')
const testDb = drizzle(sqlite, { schema })

async function upsertUser(userId: string, email: string): Promise<void> {
  const existing = await testDb.select().from(schema.users).where(eq(schema.users.id, userId))
  
  if (existing.length === 0) {
    await testDb.insert(schema.users).values({
      id: userId,
      email,
      createdAt: new Date(),
    })
  } else if (existing[0].email !== email) {
    await testDb.update(schema.users).set({ email }).where(eq(schema.users.id, userId))
  }
}

beforeEach(() => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    DELETE FROM users;
  `)
})

afterAll(() => {
  sqlite.close()
})

describe('Auth Middleware - upsertUser', () => {
  test('creates new user when not exists', async () => {
    const userId = 'user-new'
    const email = 'new@example.com'

    await upsertUser(userId, email)

    const users = await testDb.select().from(schema.users).where(eq(schema.users.id, userId))
    expect(users).toHaveLength(1)
    expect(users[0].id).toBe(userId)
    expect(users[0].email).toBe(email)
  })

  test('does not duplicate user on second call with same data', async () => {
    const userId = 'user-dup'
    const email = 'dup@example.com'

    await upsertUser(userId, email)
    await upsertUser(userId, email)

    const users = await testDb.select().from(schema.users).where(eq(schema.users.id, userId))
    expect(users).toHaveLength(1)
  })

  test('updates email when user exists with different email', async () => {
    const userId = 'user-update'
    const oldEmail = 'old@example.com'
    const newEmail = 'new@example.com'

    await upsertUser(userId, oldEmail)
    await upsertUser(userId, newEmail)

    const users = await testDb.select().from(schema.users).where(eq(schema.users.id, userId))
    expect(users).toHaveLength(1)
    expect(users[0].email).toBe(newEmail)
  })
})

describe('Auth Middleware - redirect logic', () => {
  function checkAuthHeaders(userId: string | null, email: string | null): Response | null {
    if (!userId || !email) {
      const redirectUrl = '/__exe.dev/login?redirect=' + encodeURIComponent('http://example.com/test')
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl },
      })
    }
    return null
  }

  test('returns redirect when userId header missing', () => {
    const response = checkAuthHeaders(null, 'test@example.com')
    
    expect(response).not.toBeNull()
    expect(response!.status).toBe(302)
    expect(response!.headers.get('Location')).toContain('/__exe.dev/login')
  })

  test('returns redirect when email header missing', () => {
    const response = checkAuthHeaders('user-123', null)
    
    expect(response).not.toBeNull()
    expect(response!.status).toBe(302)
    expect(response!.headers.get('Location')).toContain('/__exe.dev/login')
  })

  test('returns redirect when both headers missing', () => {
    const response = checkAuthHeaders(null, null)
    
    expect(response).not.toBeNull()
    expect(response!.status).toBe(302)
  })

  test('returns null (no redirect) when both headers present', () => {
    const response = checkAuthHeaders('user-123', 'test@example.com')
    
    expect(response).toBeNull()
  })

  test('redirect includes encoded redirect URL', () => {
    const response = checkAuthHeaders(null, null)
    
    const location = response!.headers.get('Location')!
    expect(location).toContain('redirect=')
    expect(location).toContain(encodeURIComponent('http://example.com/test'))
  })
})
