import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as os from 'node:os'

let testDir: string

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

beforeAll(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'amalgam-upload-test-'))
})

afterAll(async () => {
  await fs.rm(testDir, { recursive: true, force: true })
})

describe('Upload endpoint logic', () => {
  describe('ensureDir', () => {
    test('creates directory if not exists', async () => {
      const newDir = path.join(testDir, 'new-dir')
      
      await ensureDir(newDir)
      
      const stat = await fs.stat(newDir)
      expect(stat.isDirectory()).toBe(true)
    })

    test('creates nested directories', async () => {
      const nestedDir = path.join(testDir, 'level1', 'level2', 'level3')
      
      await ensureDir(nestedDir)
      
      const stat = await fs.stat(nestedDir)
      expect(stat.isDirectory()).toBe(true)
    })

    test('does not throw if directory exists', async () => {
      const existingDir = path.join(testDir, 'existing')
      await fs.mkdir(existingDir)
      
      await expect(ensureDir(existingDir)).resolves.toBeUndefined()
    })
  })

  describe('file writing', () => {
    test('writes file content correctly', async () => {
      const filePath = path.join(testDir, 'uploaded.txt')
      const content = 'Hello, World!'
      
      await fs.writeFile(filePath, content)
      
      const written = await fs.readFile(filePath, 'utf-8')
      expect(written).toBe(content)
    })

    test('writes binary content correctly', async () => {
      const filePath = path.join(testDir, 'binary.bin')
      const content = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff])
      
      await fs.writeFile(filePath, content)
      
      const written = await fs.readFile(filePath)
      expect(Buffer.compare(written, content)).toBe(0)
    })

    test('writes to nested path', async () => {
      const filePath = path.join(testDir, 'uploads', 'nested', 'file.txt')
      const dirPath = path.dirname(filePath)
      
      await ensureDir(dirPath)
      await fs.writeFile(filePath, 'nested content')
      
      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toBe('nested content')
    })

    test('overwrites existing file', async () => {
      const filePath = path.join(testDir, 'overwrite.txt')
      
      await fs.writeFile(filePath, 'original')
      await fs.writeFile(filePath, 'updated')
      
      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toBe('updated')
    })
  })

  describe('upload tracking', () => {
    test('tracks successful uploads', async () => {
      const uploaded: string[] = []
      const failed: string[] = []
      
      const files = ['file1.txt', 'file2.txt']
      
      for (const filePath of files) {
        try {
          const fullPath = path.join(testDir, 'tracking', filePath)
          const dirPath = path.dirname(fullPath)
          await ensureDir(dirPath)
          await fs.writeFile(fullPath, 'content')
          uploaded.push(filePath)
        } catch {
          failed.push(filePath)
        }
      }
      
      expect(uploaded).toHaveLength(2)
      expect(failed).toHaveLength(0)
    })

    test('tracks failed uploads separately', async () => {
      const uploaded: string[] = []
      const failed: string[] = []
      
      const files = ['success.txt', 'fail.txt']
      
      for (const filePath of files) {
        try {
          if (filePath === 'fail.txt') {
            throw new Error('Simulated failure')
          }
          const fullPath = path.join(testDir, 'tracking2', filePath)
          const dirPath = path.dirname(fullPath)
          await ensureDir(dirPath)
          await fs.writeFile(fullPath, 'content')
          uploaded.push(filePath)
        } catch {
          failed.push(filePath)
        }
      }
      
      expect(uploaded).toHaveLength(1)
      expect(failed).toHaveLength(1)
      expect(uploaded[0]).toBe('success.txt')
      expect(failed[0]).toBe('fail.txt')
    })
  })

  describe('path handling', () => {
    test('handles subdirectory paths', async () => {
      const filePath = 'src/components/Button.tsx'
      const fullPath = path.join(testDir, 'paths', filePath)
      const dirPath = path.dirname(fullPath)
      
      await ensureDir(dirPath)
      await fs.writeFile(fullPath, 'component code')
      
      const content = await fs.readFile(fullPath, 'utf-8')
      expect(content).toBe('component code')
    })

    test('handles deeply nested paths', async () => {
      const filePath = 'a/b/c/d/e/file.txt'
      const fullPath = path.join(testDir, 'deep', filePath)
      const dirPath = path.dirname(fullPath)
      
      await ensureDir(dirPath)
      await fs.writeFile(fullPath, 'deep content')
      
      const content = await fs.readFile(fullPath, 'utf-8')
      expect(content).toBe('deep content')
    })
  })
})
