import { describe, test, expect } from 'bun:test'
import { computeDiff, type FileManifest } from '../sync'

const makeFile = (path: string, size = 100, mtime = Date.now()): FileManifest => ({
  path,
  size,
  mtime,
})

describe('computeDiff', () => {
  describe('empty manifests', () => {
    test('returns no changes for empty manifests', () => {
      const result = computeDiff([], [])
      
      expect(result.newFiles).toHaveLength(0)
      expect(result.changedFiles).toHaveLength(0)
      expect(result.unchangedFiles).toHaveLength(0)
      expect(result.deletedFiles).toHaveLength(0)
      expect(result.conflicts).toHaveLength(0)
    })
  })

  describe('new files', () => {
    test('detects new file in local', () => {
      const local = [makeFile('new-file.ts')]
      const remote: FileManifest[] = []
      
      const result = computeDiff(local, remote)
      
      expect(result.newFiles).toHaveLength(1)
      expect(result.newFiles[0].path).toBe('new-file.ts')
    })

    test('detects multiple new files', () => {
      const local = [
        makeFile('file1.ts'),
        makeFile('file2.ts'),
        makeFile('src/file3.ts'),
      ]
      const remote: FileManifest[] = []
      
      const result = computeDiff(local, remote)
      
      expect(result.newFiles).toHaveLength(3)
    })
  })

  describe('changed files', () => {
    test('detects file with different size', () => {
      const mtime = Date.now()
      const local = [makeFile('app.ts', 200, mtime)]
      const remote = [makeFile('app.ts', 100, mtime)]
      
      const result = computeDiff(local, remote)
      
      expect(result.changedFiles).toHaveLength(1)
      expect(result.changedFiles[0].path).toBe('app.ts')
    })

    test('detects file with different mtime', () => {
      const local = [makeFile('app.ts', 100, 2000)]
      const remote = [makeFile('app.ts', 100, 1000)]
      
      const result = computeDiff(local, remote)
      
      expect(result.changedFiles).toHaveLength(1)
      expect(result.changedFiles[0].path).toBe('app.ts')
    })

    test('detects file with both size and mtime different', () => {
      const local = [makeFile('app.ts', 200, 2000)]
      const remote = [makeFile('app.ts', 100, 1000)]
      
      const result = computeDiff(local, remote)
      
      expect(result.changedFiles).toHaveLength(1)
    })
  })

  describe('unchanged files', () => {
    test('detects unchanged file with same size and mtime', () => {
      const mtime = Date.now()
      const local = [makeFile('app.ts', 100, mtime)]
      const remote = [makeFile('app.ts', 100, mtime)]
      
      const result = computeDiff(local, remote)
      
      expect(result.unchangedFiles).toHaveLength(1)
      expect(result.unchangedFiles[0].path).toBe('app.ts')
    })

    test('unchanged files have correct properties', () => {
      const mtime = 1234567890
      const local = [makeFile('app.ts', 100, mtime)]
      const remote = [makeFile('app.ts', 100, mtime)]
      
      const result = computeDiff(local, remote)
      
      expect(result.unchangedFiles[0].size).toBe(100)
      expect(result.unchangedFiles[0].mtime).toBe(mtime)
    })
  })

  describe('deleted files', () => {
    test('detects file in remote but not local', () => {
      const local: FileManifest[] = []
      const remote = [makeFile('old-file.ts')]
      
      const result = computeDiff(local, remote)
      
      expect(result.deletedFiles).toHaveLength(1)
      expect(result.deletedFiles[0].path).toBe('old-file.ts')
    })

    test('detects multiple deleted files', () => {
      const local: FileManifest[] = []
      const remote = [
        makeFile('old1.ts'),
        makeFile('old2.ts'),
        makeFile('old3.ts'),
      ]
      
      const result = computeDiff(local, remote)
      
      expect(result.deletedFiles).toHaveLength(3)
    })
  })

  describe('conflicts', () => {
    test('detects conflict when both modified after last sync', () => {
      const lastSyncedAt = new Date(1000)
      const local = [makeFile('app.ts', 200, 2000)]
      const remote = [makeFile('app.ts', 150, 1500)]
      
      const result = computeDiff(local, remote, lastSyncedAt)
      
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].path).toBe('app.ts')
      expect(result.conflicts[0].local.size).toBe(200)
      expect(result.conflicts[0].remote.size).toBe(150)
    })

    test('no conflict when only local modified after sync', () => {
      const lastSyncedAt = new Date(1500)
      const local = [makeFile('app.ts', 200, 2000)]
      const remote = [makeFile('app.ts', 100, 1000)]
      
      const result = computeDiff(local, remote, lastSyncedAt)
      
      expect(result.conflicts).toHaveLength(0)
      expect(result.changedFiles).toHaveLength(1)
    })

    test('no conflict when only remote modified after sync', () => {
      const lastSyncedAt = new Date(1500)
      const local = [makeFile('app.ts', 100, 1000)]
      const remote = [makeFile('app.ts', 200, 2000)]
      
      const result = computeDiff(local, remote, lastSyncedAt)
      
      expect(result.conflicts).toHaveLength(0)
      expect(result.changedFiles).toHaveLength(1)
    })

    test('no conflict detection without lastSyncedAt', () => {
      const local = [makeFile('app.ts', 200, 2000)]
      const remote = [makeFile('app.ts', 150, 1500)]
      
      const result = computeDiff(local, remote)
      
      expect(result.conflicts).toHaveLength(0)
      expect(result.changedFiles).toHaveLength(1)
    })
  })

  describe('mixed scenarios', () => {
    test('correctly categorizes multiple file types', () => {
      const mtime = 1000
      const lastSyncedAt = new Date(500)
      
      const local = [
        makeFile('new.ts', 100, 1000),
        makeFile('unchanged.ts', 100, mtime),
        makeFile('changed.ts', 200, 600),
        makeFile('conflict.ts', 300, 1000),
      ]
      
      const remote = [
        makeFile('unchanged.ts', 100, mtime),
        makeFile('changed.ts', 100, 400),
        makeFile('conflict.ts', 150, 800),
        makeFile('deleted.ts', 100, 400),
      ]
      
      const result = computeDiff(local, remote, lastSyncedAt)
      
      expect(result.newFiles).toHaveLength(1)
      expect(result.newFiles[0].path).toBe('new.ts')
      
      expect(result.unchangedFiles).toHaveLength(1)
      expect(result.unchangedFiles[0].path).toBe('unchanged.ts')
      
      expect(result.changedFiles).toHaveLength(1)
      expect(result.changedFiles[0].path).toBe('changed.ts')
      
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].path).toBe('conflict.ts')
      
      expect(result.deletedFiles).toHaveLength(1)
      expect(result.deletedFiles[0].path).toBe('deleted.ts')
    })

    test('handles same file appearing in correct category only once', () => {
      const local = [makeFile('file.ts', 100, 1000)]
      const remote = [makeFile('file.ts', 100, 1000)]
      
      const result = computeDiff(local, remote)
      
      const allPaths = [
        ...result.newFiles.map(f => f.path),
        ...result.changedFiles.map(f => f.path),
        ...result.unchangedFiles.map(f => f.path),
        ...result.deletedFiles.map(f => f.path),
        ...result.conflicts.map(c => c.path),
      ]
      
      const uniquePaths = new Set(allPaths)
      expect(uniquePaths.size).toBe(allPaths.length)
    })
  })
})
