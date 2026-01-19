import { createFileRoute } from '@tanstack/react-router'
import { db, schema } from '~/server/db'
import { eq } from 'drizzle-orm'
import { authMiddleware } from '~/server/middleware/auth'
import { cancelChat } from '~/server/opencode/chat'

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
}

export const Route = createFileRoute('/api/chats/$chatId/cancel')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      POST: async ({ params, context }) => {
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

        const cancelled = cancelChat(chatId)

        if (cancelled) {
          await db
            .update(schema.chats)
            .set({ lastActiveAt: new Date(), status: 'idle' })
            .where(eq(schema.chats.id, chatId))
        }

        return jsonResponse({ success: true, cancelled })
      },
    },
  },
})
