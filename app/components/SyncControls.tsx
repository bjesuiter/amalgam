import { useState } from 'react'
import { Upload, Download, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { getWorkdirHandle } from '~/lib/fs-storage'
import { buildLocalManifest, computeDiff } from '~/lib/sync'
import type { FileManifest, ConflictInfo } from '~/lib/sync'
import { readFile } from '~/lib/fs-api'
import { ConflictDialog } from './ConflictDialog'

interface SyncControlsProps {
  workdirId: string
  onSyncComplete?: () => void
}

type SyncState = 'idle' | 'uploading' | 'downloading'

interface UploadProgress {
  current: number
  total: number
}

export function SyncControls({ workdirId, onSyncComplete }: SyncControlsProps) {
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)
  const [pendingConflicts, setPendingConflicts] = useState<ConflictInfo[]>([])
  const [pendingUploadData, setPendingUploadData] = useState<{
    handle: FileSystemDirectoryHandle
    filesToUpload: FileManifest[]
  } | null>(null)

  const handleUpload = async () => {
    setError(null)
    setSyncState('uploading')

    try {
      const handle = await getWorkdirHandle(workdirId)
      if (!handle) {
        setError('Local folder not connected. Please re-link the folder.')
        setSyncState('idle')
        return
      }

      const localManifest = await buildLocalManifest(handle)

      const manifestResponse = await fetch(`/api/workdirs/${workdirId}/manifest`)
      if (!manifestResponse.ok) {
        throw new Error('Failed to fetch remote manifest')
      }
      const { files: remoteManifest } = await manifestResponse.json() as { files: FileManifest[] }

      const diff = computeDiff(localManifest, remoteManifest)

      if (diff.conflicts.length > 0) {
        setPendingConflicts(diff.conflicts)
        setPendingUploadData({
          handle,
          filesToUpload: [...diff.newFiles, ...diff.changedFiles],
        })
        setConflictDialogOpen(true)
        setSyncState('idle')
        return
      }

      const filesToUpload = [...diff.newFiles, ...diff.changedFiles]
      await uploadFiles(handle, filesToUpload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setSyncState('idle')
    }
  }

  const uploadFiles = async (
    handle: FileSystemDirectoryHandle,
    files: FileManifest[]
  ) => {
    if (files.length === 0) {
      setSyncState('idle')
      onSyncComplete?.()
      return
    }

    setProgress({ current: 0, total: files.length })

    const formData = new FormData()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const blob = await readFile(handle, file.path)
      formData.append('files', blob, file.path)
      setProgress({ current: i + 1, total: files.length })
    }

    const response = await fetch(`/api/workdirs/${workdirId}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    setProgress(null)
    setSyncState('idle')
    onSyncComplete?.()
  }

  const handleConflictResolve = async (resolution: 'overwrite' | 'skip' | 'cancel') => {
    if (resolution === 'cancel' || !pendingUploadData) {
      setPendingConflicts([])
      setPendingUploadData(null)
      return
    }

    setSyncState('uploading')

    try {
      let filesToUpload = pendingUploadData.filesToUpload

      if (resolution === 'overwrite') {
        const conflictFiles = pendingConflicts.map((c) => c.local)
        filesToUpload = [...filesToUpload, ...conflictFiles]
      }

      await uploadFiles(pendingUploadData.handle, filesToUpload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setSyncState('idle')
    } finally {
      setPendingConflicts([])
      setPendingUploadData(null)
    }
  }

  const handleDownload = () => {
    alert('Download not yet implemented')
  }

  const isSyncing = syncState !== 'idle'

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleUpload} disabled={isSyncing}>
          {syncState === 'uploading' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {syncState === 'uploading' && progress
            ? `Uploading (${progress.current}/${progress.total})`
            : 'Upload'}
        </Button>
        <Button variant="outline" onClick={handleDownload} disabled={isSyncing}>
          {syncState === 'downloading' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <ConflictDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
        conflicts={pendingConflicts}
        onResolve={handleConflictResolve}
      />
    </>
  )
}
