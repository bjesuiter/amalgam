import { createFileRoute } from '@tanstack/react-router'
import { db, schema } from '~/server/db'
import { eq, and } from 'drizzle-orm'
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

export const Route = createFileRoute('/api/workdirs/$id/chats')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      GET: async ({ params, context }) => {
        const { userId } = context as { userId: string }
        const { id: workdirId } = params
        
        const workdir = await db
          .select()
          .from(schema.workdirs)
          .where(and(eq(schema.workdirs.id, workdirId), eq(schema.workdirs.userId, userId)))
        
        if (workdir.length === 0) {
          return jsonResponse({ error: 'Workdir not found' }, { status: 404 })
        }
        
        const chats = await db
          .select()
          .from(schema.chats)
          .where(eq(schema.chats.workdirId, workdirId))
        
        return jsonResponse({ chats })
      },
      
      POST: async ({ params, context }) => {
        const { userId } = context as { userId: string }
        const { id: workdirId } = params
        
        const workdir = await db
          .select()
          .from(schema.workdirs)
          .where(and(eq(schema.workdirs.id, workdirId), eq(schema.workdirs.userId, userId)))
        
        if (workdir.length === 0) {
          return jsonResponse({ error: 'Workdir not found' }, { status: 404 })
        }
        
        const chatId = crypto.randomUUID()
        const now = new Date()
        
        await db.insert(schema.chats).values({
          id: chatId,
          workdirId,
          createdAt: now,
          lastActiveAt: now,
          status: 'idle',
        })
        
        const chat = await db
          .select()
          .from(schema.chats)
          .where(eq(schema.chats.id, chatId))
        
        return jsonResponse({ chat: chat[0] }, { status: 201 })
      },
    },
  },
})
