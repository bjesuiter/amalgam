import { useRef, useEffect } from 'react'
import { X, Upload, SkipForward, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { SyncCheckResult } from '~/lib/useSyncCheck'

interface SyncRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  syncResult: SyncCheckResult | null
  syncing: boolean
  onSync: () => void
  onSkip: () => void
  onCancel: () => void
}

export function SyncRequiredDialog({
  open,
  onOpenChange,
  syncResult,
  syncing,
  onSync,
  onSkip,
  onCancel,
}: SyncRequiredDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      if (!syncing) {
        onOpenChange(false)
        onCancel()
      }
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onOpenChange, onCancel, syncing])

  const handleCancel = () => {
    if (!syncing) {
      onOpenChange(false)
      onCancel()
    }
  }

  const changeCount = syncResult
    ? syncResult.newFiles + syncResult.changedFiles + syncResult.deletedFiles
    : 0

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">Sync Required</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:opacity-50"
            disabled={syncing}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Local files have changed since the last sync. Would you like to upload
            your changes before sending this message?
          </p>

          {syncResult && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">{changeCount} file{changeCount !== 1 ? 's' : ''} changed:</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {syncResult.newFiles > 0 && (
                  <li>+ {syncResult.newFiles} new file{syncResult.newFiles !== 1 ? 's' : ''}</li>
                )}
                {syncResult.changedFiles > 0 && (
                  <li>~ {syncResult.changedFiles} modified file{syncResult.changedFiles !== 1 ? 's' : ''}</li>
                )}
                {syncResult.deletedFiles > 0 && (
                  <li>- {syncResult.deletedFiles} deleted file{syncResult.deletedFiles !== 1 ? 's' : ''}</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={syncing}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onSkip} disabled={syncing}>
            <SkipForward className="mr-2 h-4 w-4" />
            Skip
          </Button>
          <Button onClick={onSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
