import { createFileRoute } from '@tanstack/react-router'
import { db, schema } from '~/server/db'
import { eq } from 'drizzle-orm'
import { authMiddleware } from '~/server/middleware/auth'

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

export const Route = createFileRoute('/api/workdirs')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      GET: async ({ context }) => {
        const { userId } = context as { userId: string }
        
        const workdirs = await db
          .select()
          .from(schema.workdirs)
          .where(eq(schema.workdirs.userId, userId))
        
        return jsonResponse({ workdirs })
      },
      
      POST: async ({ request, context }) => {
        const { userId } = context as { userId: string }
        const body = await request.json() as { name: string }
        
        if (!body.name || typeof body.name !== 'string') {
          return jsonResponse({ error: 'Name is required' }, { status: 400 })
        }
        
        const workdirId = crypto.randomUUID()
        const remotePath = `./data/${userId}/workdirs/${body.name}`
        const now = new Date()
        
        await db.insert(schema.workdirs).values({
          id: workdirId,
          userId,
          name: body.name,
          remotePath,
          createdAt: now,
        })
        
        const workdir = await db
          .select()
          .from(schema.workdirs)
          .where(eq(schema.workdirs.id, workdirId))
        
        return jsonResponse({ workdir: workdir[0] }, { status: 201 })
      },
    },
  },
})
