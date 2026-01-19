import { useState, useEffect, useCallback } from 'react'
import { Upload, Download, Loader2, FolderOpen, Cloud } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { getWorkdirHandle } from '~/lib/fs-storage'
import { buildLocalManifest, computeDiff } from '~/lib/sync'
import type { FileManifest, ConflictInfo } from '~/lib/sync'
import { readFile } from '~/lib/fs-api'
import { ConflictDialog } from './ConflictDialog'

interface SyncControlsProps {
  workdirId: string
  workdirName: string
  localFolderName: string | null
  onSyncComplete?: () => void
}

type SyncState = 'idle' | 'uploading' | 'downloading'

interface UploadProgress {
  current: number
  total: number
}

interface FileCountState {
  count: number | null
  loading: boolean
  error: string | null
}

export function SyncControls({ workdirId, workdirName, localFolderName, onSyncComplete }: SyncControlsProps) {
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)
  const [pendingConflicts, setPendingConflicts] = useState<ConflictInfo[]>([])
  const [pendingUploadData, setPendingUploadData] = useState<{
    handle: FileSystemDirectoryHandle
    filesToUpload: FileManifest[]
  } | null>(null)

  const [localFileCount, setLocalFileCount] = useState<FileCountState>({
    count: null,
    loading: false,
    error: null,
  })
  const [remoteFileCount, setRemoteFileCount] = useState<FileCountState>({
    count: null,
    loading: false,
    error: null,
  })

  const fetchLocalFileCount = useCallback(async () => {
    if (!localFolderName) {
      setLocalFileCount({ count: null, loading: false, error: null })
      return
    }

    setLocalFileCount((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const handle = await getWorkdirHandle(workdirId, false)
      if (!handle) {
        setLocalFileCount({ count: null, loading: false, error: 'Permission required' })
        return
      }

      const manifest = await buildLocalManifest(handle)
      setLocalFileCount({ count: manifest.length, loading: false, error: null })
    } catch (err) {
      setLocalFileCount({
        count: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to scan',
      })
    }
  }, [workdirId, localFolderName])

  const fetchRemoteFileCount = useCallback(async () => {
    setRemoteFileCount((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/workdirs/${workdirId}/manifest`)
      if (!response.ok) {
        throw new Error('Failed to fetch')
      }
      const { files } = (await response.json()) as { files: FileManifest[] }
      setRemoteFileCount({ count: files.length, loading: false, error: null })
    } catch (err) {
      setRemoteFileCount({
        count: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch',
      })
    }
  }, [workdirId])

  useEffect(() => {
    fetchLocalFileCount()
    fetchRemoteFileCount()
  }, [fetchLocalFileCount, fetchRemoteFileCount])

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
    fetchLocalFileCount()
    fetchRemoteFileCount()
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

  const renderFileCount = (state: FileCountState) => {
    if (state.loading) {
      return <Loader2 className="h-3 w-3 animate-spin" />
    }
    if (state.error) {
      return <span className="text-muted-foreground">N/A</span>
    }
    if (state.count === null) {
      return <span className="text-muted-foreground">-</span>
    }
    return <span>{state.count} {state.count === 1 ? 'file' : 'files'}</span>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            Local
          </div>
          <div className="flex items-center gap-2 text-sm">
            {localFolderName ? (
              <>
                <span className="truncate">{localFolderName}</span>
                <span className="text-muted-foreground">({renderFileCount(localFileCount)})</span>
              </>
            ) : (
              <span className="text-muted-foreground">Not linked</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpload}
            disabled={isSyncing || !localFolderName}
            className="w-full"
          >
            {syncState === 'uploading' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {syncState === 'uploading' && progress
              ? `${progress.current}/${progress.total}`
              : 'Upload'}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Cloud className="h-4 w-4 text-muted-foreground" />
            Remote
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="truncate">{workdirName}</span>
            <span className="text-muted-foreground">({renderFileCount(remoteFileCount)})</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isSyncing}
            className="w-full"
          >
            {syncState === 'downloading' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <ConflictDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
        conflicts={pendingConflicts}
        onResolve={handleConflictResolve}
      />
    </div>
  )
}
