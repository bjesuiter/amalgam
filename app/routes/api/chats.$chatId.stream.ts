import { createFileRoute } from '@tanstack/react-router'
import { db, schema } from '~/server/db'
import { eq } from 'drizzle-orm'
import { authMiddleware } from '~/server/middleware/auth'
import { getEventEmitter, type ChatEvent } from '~/server/opencode/chat'

export const Route = createFileRoute('/api/chats/$chatId/stream')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      GET: async ({ params, context }) => {
        const { userId } = context as { userId: string }
        const { chatId } = params

        const chat = await db
          .select({
            id: schema.chats.id,
            workdirId: schema.chats.workdirId,
          })
          .from(schema.chats)
          .innerJoin(schema.workdirs, eq(schema.chats.workdirId, schema.workdirs.id))
          .where(eq(schema.chats.id, chatId))

        if (chat.length === 0) {
          return new Response(JSON.stringify({ error: 'Chat not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const workdir = await db
          .select()
          .from(schema.workdirs)
          .where(eq(schema.workdirs.id, chat[0].workdirId))

        if (workdir.length === 0 || workdir[0].userId !== userId) {
          return new Response(JSON.stringify({ error: 'Not authorized' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const emitter = getEventEmitter(chatId)
        let closed = false

        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()

            const sendEvent = (event: ChatEvent) => {
              if (closed) return
              try {
                const data = `data: ${JSON.stringify(event)}\n\n`
                controller.enqueue(encoder.encode(data))
              } catch {
                closed = true
              }
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: 'idle' })}\n\n`))

            emitter.on('event', sendEvent)

            const keepAlive = setInterval(() => {
              if (closed) {
                clearInterval(keepAlive)
                return
              }
              try {
                controller.enqueue(encoder.encode(': keepalive\n\n'))
              } catch {
                clearInterval(keepAlive)
              }
            }, 30000)

            return () => {
              closed = true
              clearInterval(keepAlive)
              emitter.off('event', sendEvent)
            }
          },
          cancel() {
            closed = true
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      },
    },
  },
})
