import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Layout } from '~/components/Layout'
import { ChatMessage, type Message } from '~/components/ChatMessage'
import { ChatInput } from '~/components/ChatInput'
import { Button } from '~/components/ui/button'
import { ConfirmDialog } from '~/components/ConfirmDialog'
import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '~/lib/utils'
import { Trash2 } from 'lucide-react'

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
  type: 'output' | 'status' | 'error'
  content?: string
  status?: 'idle' | 'running' | 'error'
  message?: string
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

  const handleSend = async (content: string) => {
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
    <Layout workdirs={workdirs} chats={chats}>
      <div className="flex h-full flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">{chat?.title || 'New Chat'}</h1>
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
    </Layout>
  )
}
