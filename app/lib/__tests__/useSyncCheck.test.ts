import { describe, test, expect } from 'bun:test'
import * as sync from '../sync'

describe('useSyncCheck', () => {

  describe('sync detection logic', () => {
    test('computeDiff correctly identifies new files', () => {
      const local = [{ path: 'new.txt', size: 100, mtime: 1000 }]
      const remote: sync.FileManifest[] = []

      const diff = sync.computeDiff(local, remote)

      expect(diff.newFiles).toHaveLength(1)
      expect(diff.newFiles[0].path).toBe('new.txt')
      expect(diff.changedFiles).toHaveLength(0)
      expect(diff.deletedFiles).toHaveLength(0)
    })

    test('computeDiff correctly identifies changed files', () => {
      const local = [{ path: 'file.txt', size: 200, mtime: 2000 }]
      const remote = [{ path: 'file.txt', size: 100, mtime: 1000 }]

      const diff = sync.computeDiff(local, remote)

      expect(diff.changedFiles).toHaveLength(1)
      expect(diff.changedFiles[0].path).toBe('file.txt')
      expect(diff.newFiles).toHaveLength(0)
    })

    test('computeDiff correctly identifies deleted files', () => {
      const local: sync.FileManifest[] = []
      const remote = [{ path: 'deleted.txt', size: 100, mtime: 1000 }]

      const diff = sync.computeDiff(local, remote)

      expect(diff.deletedFiles).toHaveLength(1)
      expect(diff.deletedFiles[0].path).toBe('deleted.txt')
    })

    test('computeDiff returns empty diff for identical manifests', () => {
      const local = [{ path: 'same.txt', size: 100, mtime: 1000 }]
      const remote = [{ path: 'same.txt', size: 100, mtime: 1000 }]

      const diff = sync.computeDiff(local, remote)

      expect(diff.newFiles).toHaveLength(0)
      expect(diff.changedFiles).toHaveLength(0)
      expect(diff.deletedFiles).toHaveLength(0)
      expect(diff.unchangedFiles).toHaveLength(1)
    })
  })
})
