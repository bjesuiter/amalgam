import { createFileRoute } from '@tanstack/react-router'
import { db } from '~/server/db'
import { sql } from 'drizzle-orm'

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await db.run(sql`SELECT 1`)
          
          return jsonResponse({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '0.0.1',
          })
        } catch (error) {
          return jsonResponse({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
          }, { status: 503 })
        }
      },
    },
  },
})
