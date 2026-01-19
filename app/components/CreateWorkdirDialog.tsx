import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
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
  const [name, setName] = useState('')
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null)

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
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName('')
      setHandle(null)
    }
    onOpenChange(nextOpen)
  }

  const isValid = name.trim().length > 0 && handle !== null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workdir</DialogTitle>
          <DialogDescription>
            Select a local folder to sync with the server.
          </DialogDescription>
        </DialogHeader>
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
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFolder}
                className="flex-1 justify-start"
              >
                <FolderOpen className="h-4 w-4" />
                {handle ? handle.name : 'Select folder...'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
