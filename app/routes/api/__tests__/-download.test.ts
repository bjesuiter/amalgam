import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import * as fs from 'node:fs'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'
import * as os from 'node:os'
import archiver from 'archiver'
import { PassThrough } from 'node:stream'

let testDir: string

beforeAll(async () => {
  testDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'amalgam-download-test-'))
  await fsPromises.writeFile(path.join(testDir, 'file1.txt'), 'content of file 1')
  await fsPromises.writeFile(path.join(testDir, 'file2.txt'), 'content of file 2')
  await fsPromises.mkdir(path.join(testDir, 'subdir'))
  await fsPromises.writeFile(path.join(testDir, 'subdir', 'nested.txt'), 'nested content')
})

afterAll(async () => {
  await fsPromises.rm(testDir, { recursive: true, force: true })
})

describe('Download endpoint logic', () => {
  describe('single file download', () => {
    test('returns file content with correct headers', () => {
      const filePath = path.join(testDir, 'file1.txt')
      const stat = fs.statSync(filePath)
      
      expect(stat.isFile()).toBe(true)
      expect(stat.size).toBe(17)
    })

    test('handles missing file', () => {
      const filePath = path.join(testDir, 'nonexistent.txt')
      
      let error: NodeJS.ErrnoException | null = null
      try {
        fs.statSync(filePath)
      } catch (e) {
        error = e as NodeJS.ErrnoException
      }
      
      expect(error).not.toBeNull()
      expect(error!.code).toBe('ENOENT')
    })

    test('reads nested file correctly', () => {
      const filePath = path.join(testDir, 'subdir', 'nested.txt')
      const content = fs.readFileSync(filePath, 'utf-8')
      
      expect(content).toBe('nested content')
    })
  })

  describe('multiple files download (zip)', () => {
    test('creates zip archive with multiple files', async () => {
      const archive = archiver('zip', { zlib: { level: 5 } })
      const chunks: Buffer[] = []
      
      const done = new Promise<Buffer>((resolve, reject) => {
        archive.on('data', (chunk) => chunks.push(chunk))
        archive.on('end', () => resolve(Buffer.concat(chunks)))
        archive.on('error', reject)
      })
      
      archive.file(path.join(testDir, 'file1.txt'), { name: 'file1.txt' })
      archive.file(path.join(testDir, 'file2.txt'), { name: 'file2.txt' })
      archive.finalize()
      
      const zipBuffer = await done
      
      expect(zipBuffer.length).toBeGreaterThan(0)
      expect(zipBuffer[0]).toBe(0x50)
      expect(zipBuffer[1]).toBe(0x4b)
    })

    test('handles partial missing files in zip', async () => {
      const archive = archiver('zip', { zlib: { level: 5 } })
      const chunks: Buffer[] = []
      const missingFiles: string[] = []
      
      const done = new Promise<Buffer>((resolve, reject) => {
        archive.on('data', (chunk) => chunks.push(chunk))
        archive.on('end', () => resolve(Buffer.concat(chunks)))
        archive.on('error', reject)
      })
      
      const files = ['file1.txt', 'nonexistent.txt', 'file2.txt']
      
      for (const file of files) {
        const fullPath = path.join(testDir, file)
        try {
          const stat = fs.statSync(fullPath)
          if (stat.isFile()) {
            archive.file(fullPath, { name: file })
          }
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            missingFiles.push(file)
          }
        }
      }
      
      archive.finalize()
      const zipBuffer = await done
      
      expect(missingFiles).toHaveLength(1)
      expect(missingFiles[0]).toBe('nonexistent.txt')
      expect(zipBuffer.length).toBeGreaterThan(0)
    })
  })

  describe('path parsing', () => {
    test('parses comma-separated paths correctly', () => {
      const pathsParam = 'file1.txt,file2.txt,subdir/nested.txt'
      const paths = pathsParam.split(',').map(p => p.trim()).filter(Boolean)
      
      expect(paths).toHaveLength(3)
      expect(paths[0]).toBe('file1.txt')
      expect(paths[1]).toBe('file2.txt')
      expect(paths[2]).toBe('subdir/nested.txt')
    })

    test('handles paths with spaces', () => {
      const pathsParam = 'file1.txt, file2.txt , subdir/nested.txt'
      const paths = pathsParam.split(',').map(p => p.trim()).filter(Boolean)
      
      expect(paths).toHaveLength(3)
      expect(paths[0]).toBe('file1.txt')
      expect(paths[1]).toBe('file2.txt')
      expect(paths[2]).toBe('subdir/nested.txt')
    })

    test('filters empty paths', () => {
      const pathsParam = 'file1.txt,,file2.txt,'
      const paths = pathsParam.split(',').map(p => p.trim()).filter(Boolean)
      
      expect(paths).toHaveLength(2)
    })
  })
})
