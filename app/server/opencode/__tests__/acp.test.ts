import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test'
import { EventEmitter } from 'events'
import { Readable, Writable } from 'stream'
import type { ChildProcess } from 'child_process'
import { ACPClient, createACPClient, type SessionUpdate } from '../acp'

class MockStdin extends Writable {
  written: string[] = []
  _write(chunk: Buffer, _encoding: string, callback: () => void) {
    this.written.push(chunk.toString())
    callback()
  }
}

class MockStdout extends Readable {
  _read() {}
  sendLine(line: string) {
    this.push(line + '\n')
  }
}

function createMockProcess(): { process: ChildProcess; stdin: MockStdin; stdout: MockStdout } {
  const stdin = new MockStdin()
  const stdout = new MockStdout()
  const process = new EventEmitter() as ChildProcess
  ;(process as unknown as { stdin: MockStdin }).stdin = stdin
  ;(process as unknown as { stdout: MockStdout }).stdout = stdout
  return { process, stdin, stdout }
}

describe('ACPClient', () => {
  let mockProcess: ChildProcess
  let stdin: MockStdin
  let stdout: MockStdout
  let client: ACPClient

  beforeEach(() => {
    const mocks = createMockProcess()
    mockProcess = mocks.process
    stdin = mocks.stdin
    stdout = mocks.stdout
    client = new ACPClient(mockProcess)
  })

  describe('constructor', () => {
    test('throws if process has no stdin', () => {
      const proc = new EventEmitter() as ChildProcess
      ;(proc as unknown as { stdout: MockStdout }).stdout = new MockStdout()
      expect(() => new ACPClient(proc)).toThrow('Process must have stdio pipes')
    })

    test('throws if process has no stdout', () => {
      const proc = new EventEmitter() as ChildProcess
      ;(proc as unknown as { stdin: MockStdin }).stdin = new MockStdin()
      expect(() => new ACPClient(proc)).toThrow('Process must have stdio pipes')
    })
  })

  describe('initialize', () => {
    test('sends initialize request with correct params', async () => {
      const initPromise = client.initialize()

      await new Promise((r) => setTimeout(r, 10))

      expect(stdin.written).toHaveLength(1)
      const sent = JSON.parse(stdin.written[0])
      expect(sent.method).toBe('initialize')
      expect(sent.params.protocolVersion).toBe(1)
      expect(sent.params.clientInfo.name).toBe('amalgam')

      stdout.sendLine(
        JSON.stringify({
          jsonrpc: '2.0',
          id: sent.id,
          result: {
            protocolVersion: 1,
            agentCapabilities: { loadSession: true },
            agentInfo: { name: 'opencode', title: 'OpenCode', version: '1.0.0' },
          },
        })
      )

      const result = await initPromise
      expect(result.protocolVersion).toBe(1)
      expect(result.agentCapabilities.loadSession).toBe(true)
    })
  })

  describe('createSession', () => {
    test('throws if not initialized', async () => {
      await expect(client.createSession('/tmp')).rejects.toThrow('Client not initialized')
    })

    test('sends session/new and returns sessionId', async () => {
      const initPromise = client.initialize()
      await new Promise((r) => setTimeout(r, 10))
      const initReq = JSON.parse(stdin.written[0])
      stdout.sendLine(
        JSON.stringify({
          jsonrpc: '2.0',
          id: initReq.id,
          result: { protocolVersion: 1, agentCapabilities: {} },
        })
      )
      await initPromise

      const sessionPromise = client.createSession('/my/project')
      await new Promise((r) => setTimeout(r, 10))

      const sessionReq = JSON.parse(stdin.written[1])
      expect(sessionReq.method).toBe('session/new')
      expect(sessionReq.params.cwd).toBe('/my/project')

      stdout.sendLine(
        JSON.stringify({
          jsonrpc: '2.0',
          id: sessionReq.id,
          result: { sessionId: 'sess_abc123' },
        })
      )

      const sessionId = await sessionPromise
      expect(sessionId).toBe('sess_abc123')
    })
  })

  describe('sendPrompt', () => {
    test('throws if not initialized', async () => {
      await expect(client.sendPrompt('sess_123', 'Hello')).rejects.toThrow('Client not initialized')
    })

    test('sends session/prompt with text content', async () => {
      const initPromise = client.initialize()
      await new Promise((r) => setTimeout(r, 10))
      stdout.sendLine(
        JSON.stringify({
          jsonrpc: '2.0',
          id: JSON.parse(stdin.written[0]).id,
          result: { protocolVersion: 1, agentCapabilities: {} },
        })
      )
      await initPromise

      const promptPromise = client.sendPrompt('sess_abc', 'What is 2+2?')
      await new Promise((r) => setTimeout(r, 10))

      const promptReq = JSON.parse(stdin.written[1])
      expect(promptReq.method).toBe('session/prompt')
      expect(promptReq.params.sessionId).toBe('sess_abc')
      expect(promptReq.params.prompt[0].type).toBe('text')
      expect(promptReq.params.prompt[0].text).toBe('What is 2+2?')

      stdout.sendLine(
        JSON.stringify({
          jsonrpc: '2.0',
          id: promptReq.id,
          result: { stopReason: 'end_turn' },
        })
      )

      const result = await promptPromise
      expect(result.stopReason).toBe('end_turn')
    })
  })

  describe('session/update notifications', () => {
    test('emits update event for session/update notifications', async () => {
      const updates: SessionUpdate[] = []
      client.on('update', (update) => updates.push(update))

      stdout.sendLine(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'session/update',
          params: {
            sessionId: 'sess_abc',
            update: {
              sessionUpdate: 'agent_message_chunk',
              content: { type: 'text', text: 'Hello!' },
            },
          },
        })
      )

      await new Promise((r) => setTimeout(r, 10))

      expect(updates).toHaveLength(1)
      expect(updates[0].sessionId).toBe('sess_abc')
      expect(updates[0].update.sessionUpdate).toBe('agent_message_chunk')
      expect(updates[0].update.content?.text).toBe('Hello!')
    })
  })

  describe('cancel', () => {
    test('sends session/cancel notification', () => {
      client.cancel('sess_abc')

      expect(stdin.written).toHaveLength(1)
      const sent = JSON.parse(stdin.written[0])
      expect(sent.method).toBe('session/cancel')
      expect(sent.params.sessionId).toBe('sess_abc')
      expect(sent.id).toBeUndefined()
    })
  })

  describe('error handling', () => {
    test('emits error for invalid JSON', async () => {
      const errors: Error[] = []
      client.on('error', (err) => errors.push(err))

      stdout.sendLine('not valid json')
      await new Promise((r) => setTimeout(r, 10))

      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('Failed to parse JSON-RPC message')
    })

    test('rejects pending request on JSON-RPC error', async () => {
      const initPromise = client.initialize()
      await new Promise((r) => setTimeout(r, 10))

      const req = JSON.parse(stdin.written[0])
      stdout.sendLine(
        JSON.stringify({
          jsonrpc: '2.0',
          id: req.id,
          error: { code: -32600, message: 'Invalid Request' },
        })
      )

      await expect(initPromise).rejects.toThrow('Invalid Request')
    })
  })

  describe('close', () => {
    test('rejects all pending requests', async () => {
      const initPromise = client.initialize()
      await new Promise((r) => setTimeout(r, 10))

      client.close()

      await expect(initPromise).rejects.toThrow('Client closed')
    })
  })

  describe('createACPClient factory', () => {
    test('returns ACPClient instance', () => {
      const mocks = createMockProcess()
      const newClient = createACPClient(mocks.process)
      expect(newClient).toBeInstanceOf(ACPClient)
    })
  })
})
