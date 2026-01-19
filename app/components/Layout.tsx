import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Button } from '~/components/ui/button'
import { Menu } from 'lucide-react'

interface Workdir {
  id: string
  name: string
}

interface Chat {
  id: string
  title: string | null
}

interface LayoutProps {
  children: ReactNode
  workdirs?: Workdir[]
  chats?: Chat[]
  onRenameChat?: (chatId: string, newTitle: string) => Promise<void>
}

export function Layout({ children, workdirs = [], chats, onRenameChat }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <Sidebar
        workdirs={workdirs}
        chats={chats}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onRenameChat={onRenameChat}
      />

      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex h-14 items-center border-b px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-11 w-11"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 text-lg font-semibold">Amalgam</span>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
