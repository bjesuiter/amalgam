import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test'
import { EventEmitter } from 'events'
import * as manager from '../manager'
import * as acp from '../acp'
import {
  getEventEmitter,
  ensureConnection,
  sendMessage,
  cancelChat,
  disconnectChat,
  getConnection,
  getChatStatus,
  type ChatEvent,
} from '../chat'

class MockACPClient extends EventEmitter {
  initialized = false
  sessionId: string | null = null

  async initialize() {
    this.initialized = true
    return { protocolVersion: 1, agentCapabilities: {} }
  }

  async createSession(cwd: string) {
    this.sessionId = `sess_${cwd.replace(/\//g, '_')}`
    return this.sessionId
  }

  async sendPrompt(sessionId: string, text: string) {
    return { stopReason: 'end_turn' as const }
  }

  cancel(sessionId: string) {}

  close() {}
}

class MockChildProcess extends EventEmitter {
  pid = 12345
  killed = false
  stdin = new EventEmitter()
  stdout = new EventEmitter()
  stderr = new EventEmitter()

  kill() {
    this.killed = true
    return true
  }
}

let mockProcess: MockChildProcess
let mockACPClient: MockACPClient
let startSessionSpy: ReturnType<typeof spyOn>
let stopSessionSpy: ReturnType<typeof spyOn>
let createACPClientSpy: ReturnType<typeof spyOn>

beforeEach(() => {
  mockProcess = new MockChildProcess()
  mockACPClient = new MockACPClient()

  startSessionSpy = spyOn(manager, 'startSession').mockReturnValue({
    chatId: 'test-chat',
    process: mockProcess as unknown as import('child_process').ChildProcess,
    workdir: '/tmp/test',
    startedAt: new Date(),
    lastActivityAt: new Date(),
  })

  stopSessionSpy = spyOn(manager, 'stopSession').mockReturnValue(true)

  createACPClientSpy = spyOn(acp, 'createACPClient').mockReturnValue(
    mockACPClient as unknown as acp.ACPClient
  )
})

afterEach(() => {
  startSessionSpy.mockRestore()
  stopSessionSpy.mockRestore()
  createACPClientSpy.mockRestore()

  disconnectChat('test-chat')
  disconnectChat('chat-1')
  disconnectChat('chat-2')
})

describe('Chat Service', () => {
  describe('getEventEmitter', () => {
    test('returns same emitter for same chatId', () => {
      const emitter1 = getEventEmitter('chat-1')
      const emitter2 = getEventEmitter('chat-1')

      expect(emitter1).toBe(emitter2)
    })

    test('returns different emitters for different chatIds', () => {
      const emitter1 = getEventEmitter('chat-1')
      const emitter2 = getEventEmitter('chat-2')

      expect(emitter1).not.toBe(emitter2)
    })
  })

  describe('ensureConnection', () => {
    test('creates new connection and initializes ACP', async () => {
      const connection = await ensureConnection('test-chat', '/tmp/workdir')

      expect(startSessionSpy).toHaveBeenCalledWith('test-chat', '/tmp/workdir')
      expect(createACPClientSpy).toHaveBeenCalled()
      expect(connection.chatId).toBe('test-chat')
      expect(connection.workdir).toBe('/tmp/workdir')
      expect(connection.status).toBe('idle')
      expect(connection.acpSessionId).toBeTruthy()
    })

    test('returns existing connection if already connected', async () => {
      const connection1 = await ensureConnection('test-chat', '/tmp/workdir')
      const connection2 = await ensureConnection('test-chat', '/tmp/workdir')

      expect(connection1).toBe(connection2)
      expect(startSessionSpy).toHaveBeenCalledTimes(1)
    })

    test('emits status event on successful connection', async () => {
      const events: ChatEvent[] = []
      const emitter = getEventEmitter('test-chat')
      emitter.on('event', (e) => events.push(e))

      await ensureConnection('test-chat', '/tmp/workdir')

      expect(events.some((e) => e.type === 'status' && e.status === 'idle')).toBe(true)
    })
  })

  describe('sendMessage', () => {
    test('sends prompt via ACP client', async () => {
      const sendPromptSpy = spyOn(mockACPClient, 'sendPrompt')
      await ensureConnection('test-chat', '/tmp/workdir')

      await sendMessage('test-chat', '/tmp/workdir', 'Hello world')

      expect(sendPromptSpy).toHaveBeenCalled()
    })

    test('emits running status while processing', async () => {
      const events: ChatEvent[] = []
      const emitter = getEventEmitter('test-chat')
      emitter.on('event', (e) => events.push(e))

      await ensureConnection('test-chat', '/tmp/workdir')
      await sendMessage('test-chat', '/tmp/workdir', 'Hello')

      const runningEvent = events.find((e) => e.type === 'status' && e.status === 'running')
      expect(runningEvent).toBeDefined()
    })

    test('emits idle status after completion', async () => {
      const events: ChatEvent[] = []
      const emitter = getEventEmitter('test-chat')
      emitter.on('event', (e) => events.push(e))

      await ensureConnection('test-chat', '/tmp/workdir')
      await sendMessage('test-chat', '/tmp/workdir', 'Hello')

      const statusEvents = events.filter((e) => e.type === 'status')
      const lastStatus = statusEvents[statusEvents.length - 1]
      expect(lastStatus.type).toBe('status')
      expect((lastStatus as { status: string }).status).toBe('idle')
    })
  })

  describe('cancelChat', () => {
    test('returns false if no connection exists', () => {
      const result = cancelChat('nonexistent')
      expect(result).toBe(false)
    })

    test('calls cancel on ACP client', async () => {
      const cancelSpy = spyOn(mockACPClient, 'cancel')
      await ensureConnection('test-chat', '/tmp/workdir')

      cancelChat('test-chat')

      expect(cancelSpy).toHaveBeenCalled()
    })
  })

  describe('disconnectChat', () => {
    test('closes ACP client and stops session', async () => {
      const closeSpy = spyOn(mockACPClient, 'close')
      await ensureConnection('test-chat', '/tmp/workdir')

      disconnectChat('test-chat')

      expect(closeSpy).toHaveBeenCalled()
      expect(stopSessionSpy).toHaveBeenCalledWith('test-chat')
    })

    test('removes connection from map', async () => {
      await ensureConnection('test-chat', '/tmp/workdir')
      expect(getConnection('test-chat')).toBeDefined()

      disconnectChat('test-chat')

      expect(getConnection('test-chat')).toBeUndefined()
    })
  })

  describe('getChatStatus', () => {
    test('returns disconnected for unknown chat', () => {
      expect(getChatStatus('unknown')).toBe('disconnected')
    })

    test('returns idle after connection', async () => {
      await ensureConnection('test-chat', '/tmp/workdir')
      expect(getChatStatus('test-chat')).toBe('idle')
    })
  })

  describe('ACP events', () => {
    test('emits output event for agent_message_chunk', async () => {
      const events: ChatEvent[] = []
      const emitter = getEventEmitter('test-chat')
      emitter.on('event', (e) => events.push(e))

      await ensureConnection('test-chat', '/tmp/workdir')

      mockACPClient.emit('update', {
        sessionId: 'sess_test',
        update: {
          sessionUpdate: 'agent_message_chunk',
          content: { type: 'text', text: 'Hello from agent' },
        },
      })

      const outputEvent = events.find((e) => e.type === 'output' && e.content === 'Hello from agent')
      expect(outputEvent).toBeDefined()
    })

    test('emits error event on ACP error', async () => {
      const events: ChatEvent[] = []
      const emitter = getEventEmitter('test-chat')
      emitter.on('event', (e) => events.push(e))

      await ensureConnection('test-chat', '/tmp/workdir')

      mockACPClient.emit('error', new Error('Connection lost'))

      const errorEvent = events.find((e) => e.type === 'error')
      expect(errorEvent).toBeDefined()
      expect((errorEvent as { message: string }).message).toBe('Connection lost')
    })
  })
})
