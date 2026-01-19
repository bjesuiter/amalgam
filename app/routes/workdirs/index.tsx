import { createFileRoute } from '@tanstack/react-router'
import { Layout } from '~/components/Layout'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { FolderOpen, Plus } from 'lucide-react'

export const Route = createFileRoute('/workdirs/')({
  component: WorkdirsPage,
})

const mockWorkdirs = [
  { id: '1', name: 'my-project', lastSyncedAt: new Date() },
  { id: '2', name: 'another-repo', lastSyncedAt: null },
]

function WorkdirsPage() {
  return (
    <Layout workdirs={mockWorkdirs}>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workdirs</h1>
            <p className="text-muted-foreground">
              Manage your synced working directories
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Workdir
          </Button>
        </div>

        {mockWorkdirs.length === 0 ? (
          <Card className="p-8 text-center">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold">No workdirs yet</h2>
            <p className="mb-4 text-muted-foreground">
              Create your first workdir to start syncing files with your remote environment.
            </p>
            <Button>Create Workdir</Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockWorkdirs.map((workdir) => (
              <Card key={workdir.id} className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    {workdir.name}
                  </CardTitle>
                  <CardDescription>
                    {workdir.lastSyncedAt
                      ? `Last synced: ${workdir.lastSyncedAt.toLocaleDateString()}`
                      : 'Never synced'}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
