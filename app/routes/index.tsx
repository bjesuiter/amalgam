import { createFileRoute } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Amalgam</h1>
        <p className="text-lg text-muted-foreground">
          A web-based coding assistant that bridges local filesystems with
          cloud-hosted AI.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create a workdir to begin syncing files with your remote development environment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Create Workdir</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
