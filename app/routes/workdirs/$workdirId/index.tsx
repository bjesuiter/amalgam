import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Layout } from '~/components/Layout'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { FolderSync, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { removeWorkdirHandle } from '~/lib/fs-storage'
import { SyncControls } from '~/components/SyncControls'

export const Route = createFileRoute('/workdirs/$workdirId/')({
  component: WorkdirDetailPage,
})

interface Workdir {
  id: string
  name: string
  localPath: string
  lastSyncedAt: string | null
}

interface Chat {
  id: string
  title: string | null
}

function WorkdirDetailPage() {
  const { workdirId } = Route.useParams()
  const navigate = useNavigate()

  const [workdirs, setWorkdirs] = useState<Workdir[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const workdir = workdirs.find((w) => w.id === workdirId)

  const fetchData = useCallback(async () => {
    try {
      const [workdirsResponse, chatsResponse] = await Promise.all([
        fetch('/api/workdirs'),
        fetch(`/api/workdirs/${workdirId}/chats`),
      ])

      if (!workdirsResponse.ok) {
        throw new Error('Failed to fetch workdirs')
      }
      if (!chatsResponse.ok) {
        throw new Error('Failed to fetch chats')
      }

      const workdirsData = await workdirsResponse.json()
      const chatsData = await chatsResponse.json()

      setWorkdirs(workdirsData.workdirs)
      setChats(chatsData.chats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [workdirId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/workdirs/${workdirId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete workdir')
      }
      await removeWorkdirHandle(workdirId)
      navigate({ to: '/workdirs' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workdir')
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleNewChat = async () => {
    try {
      const response = await fetch(`/api/workdirs/${workdirId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: null }),
      })
      if (!response.ok) {
        throw new Error('Failed to create chat')
      }
      const result = await response.json()
      navigate({
        to: '/workdirs/$workdirId/chats/$chatId',
        params: { workdirId, chatId: result.chat.id },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat')
    }
  }

  if (loading) {
    return (
      <Layout workdirs={[]}>
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout workdirs={workdirs}>
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-destructive">{error}</p>
        </div>
      </Layout>
    )
  }

  if (!workdir) {
    return (
      <Layout workdirs={workdirs}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold">Workdir not found</h1>
            <p className="mb-4 text-muted-foreground">
              The workdir you're looking for doesn't exist.
            </p>
            <Link to="/workdirs">
              <Button>Back to Workdirs</Button>
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout workdirs={workdirs} chats={chats}>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{workdir.name}</h1>
            <p className="text-muted-foreground">
              {workdir.lastSyncedAt
                ? `Last synced: ${new Date(workdir.lastSyncedAt).toLocaleString()}`
                : 'Never synced'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderSync className="h-5 w-5" />
                Sync Status
              </CardTitle>
              <CardDescription>
                Manage file synchronization between local and remote
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SyncControls workdirId={workdirId} onSyncComplete={fetchData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chats
              </CardTitle>
              <CardDescription>
                AI coding assistant conversations for this workdir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleNewChat}>
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {chats.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Chats</h2>
            <div className="space-y-2">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  to="/workdirs/$workdirId/chats/$chatId"
                  params={{ workdirId, chatId: chat.id }}
                  className="flex items-center gap-2 rounded-md border p-3 transition-colors hover:bg-muted"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{chat.title || 'New Chat'}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workdir</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{workdir.name}"? This action cannot be undone.
              All chats associated with this workdir will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
