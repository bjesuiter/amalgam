import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
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
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onResolve('cancel')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sync Conflicts Detected</DialogTitle>
          <DialogDescription>
            {conflicts.length} file{conflicts.length !== 1 ? 's have' : ' has'} been modified both
            locally and remotely since the last sync.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto">
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
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              onResolve('cancel')
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onResolve('skip')
              onOpenChange(false)
            }}
          >
            Skip Conflicts
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onResolve('overwrite')
              onOpenChange(false)
            }}
          >
            Overwrite Remote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
