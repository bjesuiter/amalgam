import { Link, useParams } from '@tanstack/react-router'
import { cn } from '~/lib/utils'
import { FolderOpen, MessageSquare, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useState } from 'react'

interface Workdir {
  id: string
  name: string
}

interface Chat {
  id: string
  title: string | null
}

interface SidebarProps {
  workdirs: Workdir[]
  chats?: Chat[]
  className?: string
}

export function Sidebar({ workdirs, chats, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const params = useParams({ strict: false })
  const workdirId = params.workdirId as string | undefined
  const chatId = params.chatId as string | undefined

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-muted/30 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link to="/workdirs" className="text-lg font-semibold">
            Amalgam
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && 'mx-auto')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Workdir List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 flex items-center justify-between px-2">
          {!collapsed && <span className="text-xs font-medium text-muted-foreground">WORKDIRS</span>}
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <nav className="space-y-1">
          {workdirs.map((workdir) => (
            <Link
              key={workdir.id}
              to="/workdirs/$workdirId"
              params={{ workdirId: workdir.id }}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                workdirId === workdir.id && 'bg-muted font-medium'
              )}
            >
              <FolderOpen className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{workdir.name}</span>}
            </Link>
          ))}
          {workdirs.length === 0 && !collapsed && (
            <p className="px-2 py-4 text-sm text-muted-foreground">No workdirs yet</p>
          )}
        </nav>

        {/* Chat List (when workdir selected) */}
        {workdirId && chats && (
          <>
            <div className="mb-2 mt-6 flex items-center justify-between px-2">
              {!collapsed && <span className="text-xs font-medium text-muted-foreground">CHATS</span>}
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <nav className="space-y-1">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  to="/workdirs/$workdirId/chats/$chatId"
                  params={{ workdirId, chatId: chat.id }}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                    chatId === chat.id && 'bg-muted font-medium'
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{chat.title || 'New Chat'}</span>}
                </Link>
              ))}
              {chats.length === 0 && !collapsed && (
                <p className="px-2 py-4 text-sm text-muted-foreground">No chats yet</p>
              )}
            </nav>
          </>
        )}
      </div>
    </aside>
  )
}
