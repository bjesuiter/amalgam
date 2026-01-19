import { createFileRoute, Link } from '@tanstack/react-router'
import { Layout } from '~/components/Layout'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import { FolderSync, MessageSquare, Plus, Trash2, Upload, Download } from 'lucide-react'

export const Route = createFileRoute('/workdirs/$workdirId/')({
  component: WorkdirDetailPage,
})

const mockWorkdirs = [
  { id: '1', name: 'my-project', lastSyncedAt: new Date() },
  { id: '2', name: 'another-repo', lastSyncedAt: null },
]

const mockChats = [
  { id: 'chat-1', title: 'Fix authentication bug' },
  { id: 'chat-2', title: 'Add new feature' },
  { id: 'chat-3', title: null },
]

function WorkdirDetailPage() {
  const { workdirId } = Route.useParams()
  const workdir = mockWorkdirs.find((w) => w.id === workdirId)

  if (!workdir) {
    return (
      <Layout workdirs={mockWorkdirs}>
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
    <Layout workdirs={mockWorkdirs} chats={mockChats}>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{workdir.name}</h1>
            <p className="text-muted-foreground">
              {workdir.lastSyncedAt
                ? `Last synced: ${workdir.lastSyncedAt.toLocaleString()}`
                : 'Never synced'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
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
            <CardContent className="flex gap-2">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {mockChats.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Chats</h2>
            <div className="space-y-2">
              {mockChats.map((chat) => (
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
    </Layout>
  )
}
