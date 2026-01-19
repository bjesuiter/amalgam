import { useState, useRef, useEffect } from 'react'
import { FolderOpen, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { selectDirectory } from '~/lib/fs-api'

interface CreateWorkdirDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; handle: FileSystemDirectoryHandle }) => void
}

export function CreateWorkdirDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateWorkdirDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null)

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
      setName('')
      setHandle(null)
      onOpenChange(false)
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onOpenChange])

  const handleSelectFolder = async () => {
    try {
      const directoryHandle = await selectDirectory()
      setHandle(directoryHandle)
      if (!name) {
        setName(directoryHandle.name)
      }
    } catch {
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && handle) {
      onSubmit({ name: name.trim(), handle })
      setName('')
      setHandle(null)
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const isValid = name.trim().length > 0 && handle !== null

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-md rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Create Workdir</h2>
            <p className="text-sm text-muted-foreground">
              Select a local folder to sync with the server.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="workdir-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="workdir-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Folder</label>
            <Button
              type="button"
              variant="outline"
              onClick={handleSelectFolder}
              className="w-full justify-start"
            >
              <FolderOpen className="h-4 w-4" />
              {handle ? handle.name : 'Select folder...'}
            </Button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
