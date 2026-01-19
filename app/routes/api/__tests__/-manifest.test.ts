import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as os from 'node:os'
import { shouldIgnore } from '../../../lib/ignore'
import type { FileManifest } from '../../../lib/sync'

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

let testDir: string

beforeAll(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'amalgam-test-'))
})

afterAll(async () => {
  await fs.rm(testDir, { recursive: true, force: true })
})

describe('scanDirectory', () => {
  test('returns empty array for empty directory', async () => {
    const emptyDir = path.join(testDir, 'empty')
    await fs.mkdir(emptyDir)
    
    const files = await scanDirectory(emptyDir)
    
    expect(files).toHaveLength(0)
  })

  test('returns empty array for non-existent directory', async () => {
    const nonExistent = path.join(testDir, 'does-not-exist')
    
    const files = await scanDirectory(nonExistent)
    
    expect(files).toHaveLength(0)
  })

  test('returns files with correct manifest format', async () => {
    const withFiles = path.join(testDir, 'with-files')
    await fs.mkdir(withFiles)
    await fs.writeFile(path.join(withFiles, 'test.txt'), 'hello world')
    
    const files = await scanDirectory(withFiles)
    
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('test.txt')
    expect(files[0].size).toBe(11)
    expect(typeof files[0].mtime).toBe('number')
  })

  test('scans nested directories', async () => {
    const nested = path.join(testDir, 'nested')
    await fs.mkdir(nested)
    await fs.mkdir(path.join(nested, 'src'))
    await fs.writeFile(path.join(nested, 'root.txt'), 'root')
    await fs.writeFile(path.join(nested, 'src', 'app.ts'), 'app')
    
    const files = await scanDirectory(nested)
    
    expect(files).toHaveLength(2)
    const paths = files.map(f => f.path).sort()
    expect(paths).toEqual(['root.txt', 'src/app.ts'])
  })

  test('ignores node_modules', async () => {
    const withNodeModules = path.join(testDir, 'with-nm')
    await fs.mkdir(withNodeModules)
    await fs.mkdir(path.join(withNodeModules, 'node_modules'))
    await fs.writeFile(path.join(withNodeModules, 'package.json'), '{}')
    await fs.writeFile(path.join(withNodeModules, 'node_modules', 'dep.js'), 'module')
    
    const files = await scanDirectory(withNodeModules)
    
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('package.json')
  })

  test('ignores .git directory', async () => {
    const withGit = path.join(testDir, 'with-git')
    await fs.mkdir(withGit)
    await fs.mkdir(path.join(withGit, '.git'))
    await fs.writeFile(path.join(withGit, 'README.md'), '# Readme')
    await fs.writeFile(path.join(withGit, '.git', 'config'), 'config')
    
    const files = await scanDirectory(withGit)
    
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('README.md')
  })

  test('ignores .env files', async () => {
    const withEnv = path.join(testDir, 'with-env')
    await fs.mkdir(withEnv)
    await fs.writeFile(path.join(withEnv, '.env'), 'SECRET=value')
    await fs.writeFile(path.join(withEnv, '.env.local'), 'SECRET=local')
    await fs.writeFile(path.join(withEnv, 'app.ts'), 'code')
    
    const files = await scanDirectory(withEnv)
    
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('app.ts')
  })

  test('ignores log files', async () => {
    const withLogs = path.join(testDir, 'with-logs')
    await fs.mkdir(withLogs)
    await fs.writeFile(path.join(withLogs, 'debug.log'), 'log content')
    await fs.writeFile(path.join(withLogs, 'app.ts'), 'code')
    
    const files = await scanDirectory(withLogs)
    
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('app.ts')
  })

  test('ignores dist and build directories', async () => {
    const withBuild = path.join(testDir, 'with-build')
    await fs.mkdir(withBuild)
    await fs.mkdir(path.join(withBuild, 'dist'))
    await fs.mkdir(path.join(withBuild, 'build'))
    await fs.writeFile(path.join(withBuild, 'dist', 'bundle.js'), 'bundle')
    await fs.writeFile(path.join(withBuild, 'build', 'output.css'), 'css')
    await fs.writeFile(path.join(withBuild, 'src.ts'), 'source')
    
    const files = await scanDirectory(withBuild)
    
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('src.ts')
  })
})
