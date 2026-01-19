import { useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { FileManifest } from '~/lib/sync'

interface ConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflicts: Array<{ path: string; local: FileManifest; remote: FileManifest }>
  onResolve: (resolution: 'overwrite' | 'skip' | 'cancel') => void
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

export function ConflictDialog({
  open,
  onOpenChange,
  conflicts,
  onResolve,
}: ConflictDialogProps) {
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
      onResolve('cancel')
      onOpenChange(false)
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onOpenChange, onResolve])

  const handleResolve = (resolution: 'overwrite' | 'skip' | 'cancel') => {
    onResolve(resolution)
    onOpenChange(false)
  }

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-lg rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sync Conflicts Detected</h2>
            <p className="text-sm text-muted-foreground">
              {conflicts.length} file{conflicts.length !== 1 ? 's have' : ' has'} been modified both
              locally and remotely since the last sync.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleResolve('cancel')}
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 max-h-64 overflow-y-auto">
          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <div
                key={conflict.path}
                className="rounded-md border bg-muted/40 p-3 text-sm"
              >
                <p className="mb-2 font-mono font-medium text-foreground">
                  {conflict.path}
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Local:</span>{' '}
                    {formatDate(conflict.local.mtime)}
                  </div>
                  <div>
                    <span className="font-medium">Remote:</span>{' '}
                    {formatDate(conflict.remote.mtime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => handleResolve('cancel')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleResolve('skip')}>
            Skip Conflicts
          </Button>
          <Button variant="destructive" onClick={() => handleResolve('overwrite')}>
            Overwrite Remote
          </Button>
        </div>
      </div>
    </dialog>
  )
}
