import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Layout } from '~/components/Layout'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { FolderOpen, Plus } from 'lucide-react'
import { CreateWorkdirDialog } from '~/components/CreateWorkdirDialog'
import { storeWorkdirHandle } from '~/lib/fs-storage'

export const Route = createFileRoute('/workdirs/')({
  component: WorkdirsPage,
})

interface Workdir {
  id: string
  name: string
  localPath: string
  lastSyncedAt: string | null
}

function WorkdirsPage() {
  const navigate = useNavigate()
  const [workdirs, setWorkdirs] = useState<Workdir[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchWorkdirs = async () => {
    try {
      const response = await fetch('/api/workdirs')
      if (!response.ok) {
        throw new Error('Failed to fetch workdirs')
      }
      const data = await response.json()
      setWorkdirs(data.workdirs)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkdirs()
  }, [])

  const handleCreateWorkdir = async (data: { name: string; handle: FileSystemDirectoryHandle }) => {
    try {
      const response = await fetch('/api/workdirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, localPath: data.handle.name }),
      })
      if (!response.ok) {
        throw new Error('Failed to create workdir')
      }
      const result = await response.json()
      await storeWorkdirHandle(result.workdir.id, data.handle)
      setDialogOpen(false)
      await fetchWorkdirs()
      navigate({ to: '/workdirs/$workdirId', params: { workdirId: result.workdir.id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workdir')
    }
  }

  const handleWorkdirClick = (workdirId: string) => {
    navigate({ to: '/workdirs/$workdirId', params: { workdirId } })
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
      <Layout workdirs={[]}>
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-destructive">{error}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout workdirs={workdirs}>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workdirs</h1>
            <p className="text-muted-foreground">
              Manage your synced working directories
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Workdir
          </Button>
        </div>

        {workdirs.length === 0 ? (
          <Card className="p-8 text-center">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold">No workdirs yet</h2>
            <p className="mb-4 text-muted-foreground">
              Create your first workdir to start syncing files with your remote environment.
            </p>
            <Button onClick={() => setDialogOpen(true)}>Create Workdir</Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workdirs.map((workdir) => (
              <Card
                key={workdir.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => handleWorkdirClick(workdir.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    {workdir.name}
                  </CardTitle>
                  <CardDescription>
                    {workdir.lastSyncedAt
                      ? `Last synced: ${new Date(workdir.lastSyncedAt).toLocaleDateString()}`
                      : 'Never synced'}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateWorkdirDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateWorkdir}
      />
    </Layout>
  )
}
