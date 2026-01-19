import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

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
}

export function Layout({ children, workdirs = [], chats }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar workdirs={workdirs} chats={chats} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
