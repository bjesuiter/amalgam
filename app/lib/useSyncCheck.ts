import { useState, useCallback } from 'react'
import { getWorkdirHandle } from '~/lib/fs-storage'
import { buildLocalManifest, computeDiff, type FileManifest } from '~/lib/sync'

export interface SyncCheckResult {
  needsSync: boolean
  hasChanges: boolean
  newFiles: number
  changedFiles: number
  deletedFiles: number
}

export function useSyncCheck(workdirId: string) {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSync = useCallback(async (): Promise<SyncCheckResult | null> => {
    setChecking(true)
    setError(null)

    try {
      const handle = await getWorkdirHandle(workdirId, false)
      if (!handle) {
        return { needsSync: false, hasChanges: false, newFiles: 0, changedFiles: 0, deletedFiles: 0 }
      }

      const localManifest = await buildLocalManifest(handle)

      const manifestResponse = await fetch(`/api/workdirs/${workdirId}/manifest`)
      if (!manifestResponse.ok) {
        throw new Error('Failed to fetch remote manifest')
      }
      const { files: remoteManifest } = (await manifestResponse.json()) as { files: FileManifest[] }

      const diff = computeDiff(localManifest, remoteManifest)

      const hasChanges = diff.newFiles.length > 0 || diff.changedFiles.length > 0 || diff.deletedFiles.length > 0

      return {
        needsSync: hasChanges,
        hasChanges,
        newFiles: diff.newFiles.length,
        changedFiles: diff.changedFiles.length,
        deletedFiles: diff.deletedFiles.length,
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check sync status')
      return null
    } finally {
      setChecking(false)
    }
  }, [workdirId])

  return { checkSync, checking, error }
}
