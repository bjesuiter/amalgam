import { createFileRoute } from '@tanstack/react-router'
import { Layout } from '~/components/Layout'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Send, Square } from 'lucide-react'
import { useState } from 'react'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/workdirs/$workdirId/chats/$chatId')({
  component: ChatPage,
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

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const mockMessages: Message[] = [
  { id: '1', role: 'user', content: 'Can you help me fix the login bug?' },
  {
    id: '2',
    role: 'assistant',
    content:
      "I'd be happy to help you fix the login bug. Let me take a look at your authentication code.\n\nI found an issue in `auth.ts` - the token validation is not checking for expiration. Here's the fix:\n\n```typescript\nif (token.exp < Date.now()) {\n  throw new Error('Token expired');\n}\n```",
  },
  { id: '3', role: 'user', content: 'Great, that worked! Thanks!' },
]

function ChatPage() {
  const { workdirId, chatId } = Route.useParams()
  const [input, setInput] = useState('')
  const [isRunning] = useState(false)

  const chat = mockChats.find((c) => c.id === chatId)

  return (
    <Layout workdirs={mockWorkdirs} chats={mockChats}>
      <div className="flex h-full flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">{chat?.title || 'New Chat'}</h1>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                isRunning ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'
              )}
            >
              {isRunning ? 'Running' : 'Idle'}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-3xl space-y-4">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t p-4">
          <form
            className="mx-auto flex max-w-3xl gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setInput('')
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            {isRunning ? (
              <Button type="button" variant="destructive" size="icon">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      </div>
    </Layout>
  )
}
