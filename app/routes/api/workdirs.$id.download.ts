import { createFileRoute } from '@tanstack/react-router'
import { db, schema } from '~/server/db'
import { eq, and } from 'drizzle-orm'
import { authMiddleware } from '~/server/middleware/auth'
import * as fs from 'node:fs'
import * as path from 'node:path'
import archiver from 'archiver'
import { PassThrough } from 'node:stream'

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

export const Route = createFileRoute('/api/workdirs/$id/download')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      GET: async ({ params, request, context }) => {
        const { userId } = context as { userId: string }
        const { id: workdirId } = params
        
        const workdir = await db
          .select()
          .from(schema.workdirs)
          .where(and(eq(schema.workdirs.id, workdirId), eq(schema.workdirs.userId, userId)))
        
        if (workdir.length === 0) {
          return jsonResponse({ error: 'Workdir not found' }, { status: 404 })
        }
        
        const url = new URL(request.url)
        const pathsParam = url.searchParams.get('paths')
        
        if (!pathsParam) {
          return jsonResponse({ error: 'paths parameter is required' }, { status: 400 })
        }
        
        const paths = pathsParam.split(',').map(p => p.trim()).filter(Boolean)
        
        if (paths.length === 0) {
          return jsonResponse({ error: 'At least one path is required' }, { status: 400 })
        }
        
        const remotePath = workdir[0].remotePath
        
        if (paths.length === 1) {
          const filePath = path.join(remotePath, paths[0])
          
          try {
            const stat = fs.statSync(filePath)
            if (!stat.isFile()) {
              return jsonResponse({ error: 'Path is not a file' }, { status: 400 })
            }
            
            const stream = fs.createReadStream(filePath)
            const fileName = path.basename(paths[0])
            
            return new Response(stream as unknown as ReadableStream, {
              headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': stat.size.toString(),
              },
            })
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
              return jsonResponse({ error: 'File not found' }, { status: 404 })
            }
            throw error
          }
        }
        
        const archive = archiver('zip', { zlib: { level: 5 } })
        const passthrough = new PassThrough()
        
        archive.pipe(passthrough)
        
        const missingFiles: string[] = []
        
        for (const filePath of paths) {
          const fullPath = path.join(remotePath, filePath)
          
          try {
            const stat = fs.statSync(fullPath)
            if (stat.isFile()) {
              archive.file(fullPath, { name: filePath })
            }
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
              missingFiles.push(filePath)
            } else {
              throw error
            }
          }
        }
        
        archive.finalize()
        
        return new Response(passthrough as unknown as ReadableStream, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="download.zip"',
            ...(missingFiles.length > 0 && { 'X-Missing-Files': missingFiles.join(',') }),
          },
        })
      },
    },
  },
})
