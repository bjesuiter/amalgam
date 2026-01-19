import { createFileRoute } from '@tanstack/react-router'
import { db, schema } from '~/server/db'
import { eq } from 'drizzle-orm'
import { authMiddleware } from '~/server/middleware/auth'
import { sendMessage } from '~/server/opencode/chat'

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
}

export const Route = createFileRoute('/api/chats/$chatId/message')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      POST: async ({ params, request, context }) => {
        const { userId } = context as { userId: string }
        const { chatId } = params

        const chat = await db
          .select({
            id: schema.chats.id,
            workdirId: schema.chats.workdirId,
          })
          .from(schema.chats)
          .where(eq(schema.chats.id, chatId))

        if (chat.length === 0) {
          return jsonResponse({ error: 'Chat not found' }, { status: 404 })
        }

        const workdir = await db
          .select()
          .from(schema.workdirs)
          .where(eq(schema.workdirs.id, chat[0].workdirId))

        if (workdir.length === 0 || workdir[0].userId !== userId) {
          return jsonResponse({ error: 'Not authorized' }, { status: 403 })
        }

        let body: { content?: string }
        try {
          body = await request.json()
        } catch {
          return jsonResponse({ error: 'Invalid JSON body' }, { status: 400 })
        }

        if (!body.content || typeof body.content !== 'string') {
          return jsonResponse({ error: 'Missing content field' }, { status: 400 })
        }

        await db
          .update(schema.chats)
          .set({ lastActiveAt: new Date(), status: 'running' })
          .where(eq(schema.chats.id, chatId))

        try {
          await sendMessage(chatId, workdir[0].remotePath, body.content)

          await db
            .update(schema.chats)
            .set({ lastActiveAt: new Date(), status: 'idle' })
            .where(eq(schema.chats.id, chatId))

          return jsonResponse({ success: true })
        } catch (err) {
          await db
            .update(schema.chats)
            .set({ status: 'error' })
            .where(eq(schema.chats.id, chatId))

          return jsonResponse({ error: (err as Error).message }, { status: 500 })
        }
      },
    },
  },
})
