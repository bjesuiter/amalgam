import { cn } from '~/lib/utils'
import { Skeleton } from '~/components/ui/skeleton'

interface MessageSkeletonProps {
  role?: 'user' | 'assistant'
}

function SingleMessageSkeleton({ role = 'assistant' }: MessageSkeletonProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser ? 'bg-primary/20' : 'bg-muted'
        )}
      >
        <div className="space-y-2">
          <Skeleton className={cn('h-4', isUser ? 'w-32' : 'w-48')} />
          {!isUser && <Skeleton className="h-4 w-40" />}
        </div>
      </div>
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="space-y-4">
      <SingleMessageSkeleton role="user" />
      <SingleMessageSkeleton role="assistant" />
    </div>
  )
}

export { SingleMessageSkeleton }
