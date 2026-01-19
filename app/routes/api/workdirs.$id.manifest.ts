import { createFileRoute } from '@tanstack/react-router'
import { db, schema } from '~/server/db'
import { eq, and } from 'drizzle-orm'
import { authMiddleware } from '~/server/middleware/auth'
import { shouldIgnore } from '~/lib/ignore'
import type { FileManifest } from '~/lib/sync'
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

async function scanDirectory(dirPath: string, basePath: string = ''): Promise<FileManifest[]> {
  const files: FileManifest[] = []
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name
      const fullPath = path.join(dirPath, entry.name)
      
      if (shouldIgnore(relativePath)) {
        continue
      }
      
      if (entry.isDirectory()) {
        const subFiles = await scanDirectory(fullPath, relativePath)
        files.push(...subFiles)
      } else if (entry.isFile()) {
        const stat = await fs.stat(fullPath)
        files.push({
          path: relativePath,
          size: stat.size,
          mtime: stat.mtimeMs,
        })
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
  
  return files
}

export const Route = createFileRoute('/api/workdirs/$id/manifest')({
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
        
        try {
          const remotePath = workdir[0].remotePath
          const files = await scanDirectory(remotePath)
          
          return jsonResponse({ files })
        } catch (error) {
          console.error('Error scanning directory:', error)
          return jsonResponse({ error: 'Failed to scan directory' }, { status: 500 })
        }
      },
    },
  },
})
