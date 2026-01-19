import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Layout } from '~/components/Layout'
import { ChatMessage, type Message } from '~/components/ChatMessage'
import { ChatInput } from '~/components/ChatInput'
import { Button } from '~/components/ui/button'
import { ConfirmDialog } from '~/components/ConfirmDialog'
import { SyncRequiredDialog } from '~/components/SyncRequiredDialog'
import { DebugSidebar, type DebugLogEntry, type SessionInfo } from '~/components/DebugSidebar'
import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '~/lib/utils'
import { Trash2, Bug, Pencil, Check, X } from 'lucide-react'
import { Input } from '~/components/ui/input'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/ui/context-menu'
import { useSyncCheck, type SyncCheckResult } from '~/lib/useSyncCheck'
import { getWorkdirHandle } from '~/lib/fs-storage'
import { buildLocalManifest, computeDiff, type FileManifest } from '~/lib/sync'
import { readFile } from '~/lib/fs-api'
import { isDevMode } from '~/lib/devMode'

export const Route = createFileRoute('/workdirs/$workdirId/chats/$chatId')({
  component: ChatPage,
})

interface Workdir {
  id: string
  name: string
  lastSyncedAt: string | null
}

interface Chat {
  id: string
  title: string | null
  status: 'idle' | 'running' | 'error'
}

type ChatStatus = 'idle' | 'running' | 'error' | 'connecting'

interface ChatEvent {
  type: 'output' | 'status' | 'error' | 'debug_request' | 'debug_response' | 'debug_session_info'
  content?: string
  status?: 'idle' | 'running' | 'error'
  message?: string
  id?: string
  timestamp?: string
  method?: string
  params?: unknown
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
  pid?: number
  acpSessionId?: string
  workdir?: string
}

function ChatPage() {
  const { workdirId, chatId } = Route.useParams()
  const navigate = useNavigate()

  const [workdirs, setWorkdirs] = useState<Workdir[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<ChatStatus>('connecting')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [pendingSyncResult, setPendingSyncResult] = useState<SyncCheckResult | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasCheckedSync, setHasCheckedSync] = useState(false)
  
  const [debugSidebarOpen, setDebugSidebarOpen] = useState(isDevMode())
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([])
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    connectionStatus: 'connecting',
  })

  const { checkSync, checking: checkingSync } = useSyncCheck(workdirId)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const currentAssistantMessageRef = useRef<string>('')

  const chat = chats.find((c) => c.id === chatId)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workdirsRes, chatsRes] = await Promise.all([
          fetch('/api/workdirs'),
          fetch(`/api/workdirs/${workdirId}/chats`),
        ])

        if (!workdirsRes.ok || !chatsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const [workdirsData, chatsData] = await Promise.all([
          workdirsRes.json(),
          chatsRes.json(),
        ])

        setWorkdirs(workdirsData.workdirs)
        setChats(chatsData.chats)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [workdirId])

  useEffect(() => {
    const eventSource = new EventSource(`/api/chats/${chatId}/stream`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setStatus('idle')
    }

    eventSource.onmessage = (event) => {
      try {
        const data: ChatEvent = JSON.parse(event.data)

        if (data.type === 'status') {
          setStatus(data.status || 'idle')
          setSessionInfo((prev) => ({
            ...prev,
            connectionStatus: data.status === 'error' ? 'disconnected' : 'connected',
          }))

          if (data.status === 'idle' && currentAssistantMessageRef.current) {
            setMessages((prev) => {
              const updated = [...prev]
              const lastIdx = updated.length - 1
              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  isStreaming: false,
                }
              }
              return updated
            })
            currentAssistantMessageRef.current = ''
          }
        } else if (data.type === 'output' && data.content) {
          currentAssistantMessageRef.current += data.content

          setMessages((prev) => {
            const updated = [...prev]
            const lastIdx = updated.length - 1

            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant' && updated[lastIdx].isStreaming) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: currentAssistantMessageRef.current,
              }
            } else {
              updated.push({
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: currentAssistantMessageRef.current,
                isStreaming: true,
              })
            }

            return updated
          })
        } else if (data.type === 'error') {
          setError(data.message || 'An error occurred')
        } else if (data.type === 'debug_request' && data.method) {
          setDebugLogs((prev) => [
            ...prev.slice(-99),
            {
              id: `req-${data.id}-${Date.now()}`,
              timestamp: new Date(data.timestamp || Date.now()),
              direction: 'sent',
              method: data.method!,
              payload: data.params,
            },
          ])
        } else if (data.type === 'debug_response' && data.method) {
          setDebugLogs((prev) => [
            ...prev.slice(-99),
            {
              id: `res-${data.id}-${Date.now()}`,
              timestamp: new Date(data.timestamp || Date.now()),
              direction: 'received',
              method: data.method!,
              payload: data.error || data.result,
              isError: !!data.error,
            },
          ])
        } else if (data.type === 'debug_session_info') {
          setSessionInfo((prev) => ({
            ...prev,
            pid: data.pid,
            acpSessionId: data.acpSessionId,
            workdir: data.workdir,
          }))
        }
      } catch {
      }
    }

    eventSource.onerror = () => {
      setStatus('error')
      eventSource.close()
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [chatId])

  const doSendMessage = async (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
      },
    ])

    currentAssistantMessageRef.current = ''

    try {
      const response = await fetch(`/api/chats/${chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  const handleSend = async (content: string) => {
    if (hasCheckedSync) {
      await doSendMessage(content)
      return
    }

    const syncResult = await checkSync()
    if (!syncResult) {
      await doSendMessage(content)
      setHasCheckedSync(true)
      return
    }

    if (!syncResult.needsSync) {
      await doSendMessage(content)
      setHasCheckedSync(true)
      return
    }

    setPendingMessage(content)
    setPendingSyncResult(syncResult)
    setSyncDialogOpen(true)
  }

  const handleSyncAndSend = async () => {
    if (!pendingMessage) return

    setSyncing(true)
    setError(null)

    try {
      const handle = await getWorkdirHandle(workdirId)
      if (!handle) {
        throw new Error('Local folder not connected')
      }

      const localManifest = await buildLocalManifest(handle)
      const manifestResponse = await fetch(`/api/workdirs/${workdirId}/manifest`)
      if (!manifestResponse.ok) {
        throw new Error('Failed to fetch remote manifest')
      }
      const { files: remoteManifest } = (await manifestResponse.json()) as { files: FileManifest[] }

      const diff = computeDiff(localManifest, remoteManifest)
      const filesToUpload = [...diff.newFiles, ...diff.changedFiles]

      if (filesToUpload.length > 0) {
        const formData = new FormData()
        for (const file of filesToUpload) {
          const blob = await readFile(handle, file.path)
          formData.append('files', blob, file.path)
        }

        const uploadResponse = await fetch(`/api/workdirs/${workdirId}/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Upload failed')
        }
      }

      setSyncDialogOpen(false)
      setHasCheckedSync(true)
      await doSendMessage(pendingMessage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
      setPendingMessage(null)
      setPendingSyncResult(null)
    }
  }

  const handleSkipSync = async () => {
    setSyncDialogOpen(false)
    setHasCheckedSync(true)
    if (pendingMessage) {
      await doSendMessage(pendingMessage)
    }
    setPendingMessage(null)
    setPendingSyncResult(null)
  }

  const handleCancelSync = () => {
    setSyncDialogOpen(false)
    setPendingMessage(null)
    setPendingSyncResult(null)
  }

  const handleCancel = async () => {
    try {
      await fetch(`/api/chats/${chatId}/cancel`, { method: 'POST' })
    } catch {
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete chat')
      }
      navigate({ to: '/workdirs/$workdirId', params: { workdirId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chat')
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const startEditingTitle = () => {
    setEditTitleValue(chat?.title || '')
    setIsEditingTitle(true)
    setTimeout(() => titleInputRef.current?.focus(), 0)
  }

  const cancelEditingTitle = () => {
    setIsEditingTitle(false)
    setEditTitleValue('')
  }

  const saveTitle = async () => {
    const newTitle = editTitleValue.trim()
    
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to rename chat')
      }
      
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: newTitle || null } : c))
      )
      setIsEditingTitle(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename chat')
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveTitle()
    } else if (e.key === 'Escape') {
      cancelEditingTitle()
    }
  }

  const handleRenameChat = async (targetChatId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chats/${targetChatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to rename chat')
      }
      
      setChats((prev) =>
        prev.map((c) => (c.id === targetChatId ? { ...c, title: newTitle || null } : c))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename chat')
    }
  }

  if (loading) {
    return (
      <Layout workdirs={[]}>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout workdirs={workdirs} chats={chats} onRenameChat={handleRenameChat}>
      <div className="flex h-full">
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <Input
                    ref={titleInputRef}
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={saveTitle}
                    className="h-8 w-48 font-semibold"
                    placeholder="Chat title..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={saveTitle}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={cancelEditingTitle}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <ContextMenu>
                  <ContextMenuTrigger>
                    <h1 className="font-semibold">
                      {chat?.title || 'New Chat'}
                    </h1>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={startEditingTitle}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  status === 'running' && 'bg-green-500/20 text-green-600',
                  status === 'idle' && 'bg-muted text-muted-foreground',
                  status === 'error' && 'bg-destructive/20 text-destructive',
                  status === 'connecting' && 'bg-yellow-500/20 text-yellow-600'
                )}
              >
                {status === 'running' && 'Running'}
                {status === 'idle' && 'Idle'}
                {status === 'error' && 'Error'}
                {status === 'connecting' && 'Connecting...'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isDevMode() && (
                <Button
                  variant={debugSidebarOpen ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setDebugSidebarOpen(!debugSidebarOpen)}
                  title="Toggle Debug Panel"
                >
                  <Bug className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center py-20">
                  <p className="text-muted-foreground">
                    Send a message to start the conversation
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t p-4">
            <ChatInput
              onSend={handleSend}
              onCancel={handleCancel}
              isRunning={status === 'running'}
              disabled={status === 'connecting' || status === 'error'}
            />
          </div>
        </div>

        {isDevMode() && (
          <DebugSidebar
            isOpen={debugSidebarOpen}
            onToggle={() => setDebugSidebarOpen(!debugSidebarOpen)}
            sessionInfo={sessionInfo}
            logs={debugLogs}
            onClearLogs={() => setDebugLogs([])}
          />
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Chat"
        description="Are you sure you want to delete this chat? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />

      <SyncRequiredDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        syncResult={pendingSyncResult}
        syncing={syncing}
        onSync={handleSyncAndSend}
        onSkip={handleSkipSync}
        onCancel={handleCancelSync}
      />
    </Layout>
  )
}
