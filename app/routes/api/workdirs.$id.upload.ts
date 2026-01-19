import { createFileRoute } from '@tanstack/react-router'
import { db, schema } from '~/server/db'
import { eq, and } from 'drizzle-orm'
import { authMiddleware } from '~/server/middleware/auth'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

export const Route = createFileRoute('/api/workdirs/$id/upload')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      POST: async ({ params, request, context }) => {
        const { userId } = context as { userId: string }
        const { id: workdirId } = params
        
        const workdir = await db
          .select()
          .from(schema.workdirs)
          .where(and(eq(schema.workdirs.id, workdirId), eq(schema.workdirs.userId, userId)))
        
        if (workdir.length === 0) {
          return jsonResponse({ error: 'Workdir not found' }, { status: 404 })
        }
        
        const contentType = request.headers.get('content-type') || ''
        if (!contentType.includes('multipart/form-data')) {
          return jsonResponse({ error: 'Content-Type must be multipart/form-data' }, { status: 400 })
        }
        
        const formData = await request.formData()
        const remotePath = workdir[0].remotePath
        
        const uploaded: string[] = []
        const failed: string[] = []
        
        for (const [filePath, value] of formData.entries()) {
          if (typeof value === 'string') {
            failed.push(filePath)
            continue
          }
          
          try {
            const fullPath = path.join(remotePath, filePath)
            const dirPath = path.dirname(fullPath)
            
            await ensureDir(dirPath)
            
            const file = value as File
            const buffer = await file.arrayBuffer()
            await fs.writeFile(fullPath, Buffer.from(buffer))
            
            uploaded.push(filePath)
          } catch (error) {
            console.error(`Failed to upload ${filePath}:`, error)
            failed.push(filePath)
          }
        }
        
        return jsonResponse({ uploaded, failed })
      },
    },
  },
})
