import { EventEmitter } from 'events'
import {
  startSession,
  stopSession,
  getSession,
  updateSessionActivity,
  setSessionTimeoutCallback,
  startSessionCleanup,
} from './manager'
import { ACPClient, createACPClient, type SessionUpdate } from './acp'

export interface ChatConnection {
  chatId: string
  workdir: string
  acpClient: ACPClient
  acpSessionId: string | null
  status: 'idle' | 'running' | 'error'
}

export type ChatEventType = 'output' | 'status' | 'error' | 'timeout'

export interface ChatOutputEvent {
  type: 'output'
  content: string
}

export interface ChatStatusEvent {
  type: 'status'
  status: 'running' | 'idle' | 'error'
}

export interface ChatErrorEvent {
  type: 'error'
  message: string
}

export interface ChatTimeoutEvent {
  type: 'timeout'
  message: string
}

export type ChatEvent = ChatOutputEvent | ChatStatusEvent | ChatErrorEvent | ChatTimeoutEvent

const connections = new Map<string, ChatConnection>()
const eventEmitters = new Map<string, EventEmitter>()

setSessionTimeoutCallback((chatId: string) => {
  emitChatEvent(chatId, { type: 'timeout', message: 'Session timed out due to inactivity' })
  emitChatEvent(chatId, { type: 'status', status: 'idle' })
  connections.delete(chatId)
})

startSessionCleanup()

export function getEventEmitter(chatId: string): EventEmitter {
  let emitter = eventEmitters.get(chatId)
  if (!emitter) {
    emitter = new EventEmitter()
    eventEmitters.set(chatId, emitter)
  }
  return emitter
}

function emitChatEvent(chatId: string, event: ChatEvent): void {
  const emitter = eventEmitters.get(chatId)
  if (emitter) {
    emitter.emit('event', event)
  }
}

export async function ensureConnection(chatId: string, workdir: string): Promise<ChatConnection> {
  let connection = connections.get(chatId)

  if (connection) {
    return connection
  }

  const session = startSession(chatId, workdir)

  const acpClient = createACPClient(session.process)

  acpClient.on('update', (update: SessionUpdate) => {
    updateSessionActivity(chatId)

    if (update.update.sessionUpdate === 'agent_message_chunk' && update.update.content?.text) {
      emitChatEvent(chatId, { type: 'output', content: update.update.content.text })
    } else if (update.update.sessionUpdate === 'tool_call') {
      emitChatEvent(chatId, {
        type: 'output',
        content: `[Tool: ${update.update.title || 'unknown'}]`,
      })
    } else if (update.update.sessionUpdate === 'tool_call_update' && update.update.status === 'completed') {
      if (update.update.content) {
        emitChatEvent(chatId, {
          type: 'output',
          content: `[Tool result available]`,
        })
      }
    }
  })

  acpClient.on('error', (err: Error) => {
    const conn = connections.get(chatId)
    if (conn) {
      conn.status = 'error'
    }
    emitChatEvent(chatId, { type: 'error', message: err.message })
    emitChatEvent(chatId, { type: 'status', status: 'error' })
  })

  acpClient.on('close', () => {
    connections.delete(chatId)
    emitChatEvent(chatId, { type: 'status', status: 'idle' })
  })

  connection = {
    chatId,
    workdir,
    acpClient,
    acpSessionId: null,
    status: 'idle',
  }

  connections.set(chatId, connection)

  try {
    await acpClient.initialize()
    const acpSessionId = await acpClient.createSession(workdir)
    connection.acpSessionId = acpSessionId
    emitChatEvent(chatId, { type: 'status', status: 'idle' })
  } catch (err) {
    connection.status = 'error'
    emitChatEvent(chatId, { type: 'error', message: (err as Error).message })
    emitChatEvent(chatId, { type: 'status', status: 'error' })
    throw err
  }

  return connection
}

export async function sendMessage(chatId: string, workdir: string, content: string): Promise<void> {
  const connection = await ensureConnection(chatId, workdir)

  if (!connection.acpSessionId) {
    throw new Error('ACP session not initialized')
  }

  connection.status = 'running'
  emitChatEvent(chatId, { type: 'status', status: 'running' })
  updateSessionActivity(chatId)

  try {
    const result = await connection.acpClient.sendPrompt(connection.acpSessionId, content)
    connection.status = 'idle'
    emitChatEvent(chatId, { type: 'status', status: 'idle' })

    if (result.stopReason === 'cancelled') {
      emitChatEvent(chatId, { type: 'output', content: '[Cancelled]' })
    }
  } catch (err) {
    connection.status = 'error'
    emitChatEvent(chatId, { type: 'error', message: (err as Error).message })
    emitChatEvent(chatId, { type: 'status', status: 'error' })
    throw err
  }
}

export function cancelChat(chatId: string): boolean {
  const connection = connections.get(chatId)
  if (!connection || !connection.acpSessionId) {
    return false
  }

  connection.acpClient.cancel(connection.acpSessionId)
  return true
}

export function disconnectChat(chatId: string): void {
  const connection = connections.get(chatId)
  if (connection) {
    connection.acpClient.close()
    stopSession(chatId)
    connections.delete(chatId)
  }

  const emitter = eventEmitters.get(chatId)
  if (emitter) {
    emitter.removeAllListeners()
    eventEmitters.delete(chatId)
  }
}

export function getConnection(chatId: string): ChatConnection | undefined {
  return connections.get(chatId)
}

export function getChatStatus(chatId: string): 'idle' | 'running' | 'error' | 'disconnected' {
  const connection = connections.get(chatId)
  return connection ? connection.status : 'disconnected'
}
