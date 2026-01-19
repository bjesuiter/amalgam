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

export const Route = createFileRoute('/api/workdirs/$id')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      DELETE: async ({ params, context }) => {
        const { userId } = context as { userId: string }
        const { id } = params
        
        const existing = await db
          .select()
          .from(schema.workdirs)
          .where(and(eq(schema.workdirs.id, id), eq(schema.workdirs.userId, userId)))
        
        if (existing.length === 0) {
          return jsonResponse({ error: 'Workdir not found' }, { status: 404 })
        }
        
        await db
          .delete(schema.workdirs)
          .where(and(eq(schema.workdirs.id, id), eq(schema.workdirs.userId, userId)))
        
        return jsonResponse({ success: true })
      },
    },
  },
})
