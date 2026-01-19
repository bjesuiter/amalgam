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

export const Route = createFileRoute('/api/chats/$id')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      PATCH: async ({ params, context, request }) => {
        const { userId } = context as { userId: string }
        const { id: chatId } = params
        
        const body = await request.json() as { title?: string }
        
        if (typeof body.title !== 'string') {
          return jsonResponse({ error: 'Title must be a string' }, { status: 400 })
        }
        
        const chat = await db
          .select({
            chat: schema.chats,
            workdir: schema.workdirs,
          })
          .from(schema.chats)
          .innerJoin(schema.workdirs, eq(schema.chats.workdirId, schema.workdirs.id))
          .where(and(eq(schema.chats.id, chatId), eq(schema.workdirs.userId, userId)))
        
        if (chat.length === 0) {
          return jsonResponse({ error: 'Chat not found' }, { status: 404 })
        }
        
        const title = body.title.trim() || null
        
        await db
          .update(schema.chats)
          .set({ title })
          .where(eq(schema.chats.id, chatId))
        
        return jsonResponse({ success: true, title })
      },
      DELETE: async ({ params, context }) => {
        const { userId } = context as { userId: string }
        const { id: chatId } = params
        
        const chat = await db
          .select({
            chat: schema.chats,
            workdir: schema.workdirs,
          })
          .from(schema.chats)
          .innerJoin(schema.workdirs, eq(schema.chats.workdirId, schema.workdirs.id))
          .where(and(eq(schema.chats.id, chatId), eq(schema.workdirs.userId, userId)))
        
        if (chat.length === 0) {
          return jsonResponse({ error: 'Chat not found' }, { status: 404 })
        }
        
        await db.delete(schema.chats).where(eq(schema.chats.id, chatId))
        
        return jsonResponse({ success: true })
      },
    },
  },
})
