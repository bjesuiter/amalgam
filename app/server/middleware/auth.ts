import { createMiddleware } from '@tanstack/react-start'
import { db, schema } from '../db'
import { eq } from 'drizzle-orm'

export interface AuthContext {
  userId: string
  email: string
}

async function upsertUser(userId: string, email: string): Promise<void> {
  const existing = await db.select().from(schema.users).where(eq(schema.users.id, userId))
  
  if (existing.length === 0) {
    await db.insert(schema.users).values({
      id: userId,
      email,
      createdAt: new Date(),
    })
  } else if (existing[0].email !== email) {
    await db.update(schema.users).set({ email }).where(eq(schema.users.id, userId))
  }
}

const DEV_USER_ID = 'dev-user-local'
const DEV_EMAIL = 'dev@localhost'

export const authMiddleware = createMiddleware().server(async ({ request, next }) => {
  let userId = request.headers.get('X-ExeDev-UserID')
  let email = request.headers.get('X-ExeDev-Email')

  if (!userId || !email) {
    if (process.env.NODE_ENV === 'development' || import.meta.env.DEV) {
      userId = DEV_USER_ID
      email = DEV_EMAIL
    } else {
      return new Response(null, {
        status: 302,
        headers: { Location: '/__exe.dev/login?redirect=' + encodeURIComponent(request.url) },
      })
    }
  }

  await upsertUser(userId, email)

  return next({
    context: { userId, email } satisfies AuthContext,
  })
})
