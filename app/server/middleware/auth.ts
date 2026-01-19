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

export const authMiddleware = createMiddleware().server(async ({ request, next }) => {
  const userId = request.headers.get('X-ExeDev-UserID')
  const email = request.headers.get('X-ExeDev-Email')

  if (!userId || !email) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/__exe.dev/login?redirect=' + encodeURIComponent(request.url) },
    })
  }

  await upsertUser(userId, email)

  return next({
    context: { userId, email } satisfies AuthContext,
  })
})
