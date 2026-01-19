import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test'
import { EventEmitter } from 'events'
import * as childProcess from 'child_process'
import {
  startSession,
  stopSession,
  getSession,
  updateSessionActivity,
  getAllSessions,
  clearSessionsMap,
  setSessionExitCallback,
  setSessionTimeoutCallback,
  startSessionCleanup,
  stopSessionCleanup,
  getSessionTimeoutMs,
  getCleanupIntervalMs,
  type OpenCodeSession,
} from '../manager'

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
let spawnSpy: ReturnType<typeof spyOn>

beforeEach(() => {
  mockProcess = new MockChildProcess()
  spawnSpy = spyOn(childProcess, 'spawn').mockReturnValue(mockProcess as unknown as childProcess.ChildProcess)
  clearSessionsMap()
  setSessionExitCallback(undefined)
  setSessionTimeoutCallback(undefined)
  stopSessionCleanup()
})

afterEach(() => {
  spawnSpy.mockRestore()
  stopSessionCleanup()
})

describe('OpenCode Process Manager', () => {
  describe('startSession', () => {
    test('creates new session in Map', () => {
      const session = startSession('chat-1', '/tmp/workdir')

      expect(session.chatId).toBe('chat-1')
      expect(session.workdir).toBe('/tmp/workdir')
      expect(session.startedAt).toBeInstanceOf(Date)
      expect(session.lastActivityAt).toBeInstanceOf(Date)
      expect(getSession('chat-1')).toBe(session)
    })

    test('spawns opencode with acp subcommand and correct cwd', () => {
      startSession('chat-1', '/my/project')

      expect(spawnSpy).toHaveBeenCalledWith('opencode', ['acp'], {
        cwd: '/my/project',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    })

    test('kills existing session before starting new one', () => {
      const firstSession = startSession('chat-1', '/tmp/first')
      const firstProcess = mockProcess

      mockProcess = new MockChildProcess()
      spawnSpy.mockReturnValue(mockProcess as unknown as childProcess.ChildProcess)

      const secondSession = startSession('chat-1', '/tmp/second')

      expect(firstProcess.killed).toBe(true)
      expect(secondSession.workdir).toBe('/tmp/second')
      expect(getSession('chat-1')).toBe(secondSession)
    })

    test('sets startedAt and lastActivityAt to current time', () => {
      const before = new Date()
      const session = startSession('chat-1', '/tmp/workdir')
      const after = new Date()

      expect(session.startedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(session.startedAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(session.lastActivityAt.getTime()).toBe(session.startedAt.getTime())
    })
  })

  describe('stopSession', () => {
    test('removes session from Map and kills process', () => {
      startSession('chat-1', '/tmp/workdir')

      const result = stopSession('chat-1')

      expect(result).toBe(true)
      expect(mockProcess.killed).toBe(true)
      expect(getSession('chat-1')).toBeUndefined()
    })

    test('returns false for non-existent session', () => {
      const result = stopSession('non-existent')

      expect(result).toBe(false)
    })
  })

  describe('getSession', () => {
    test('returns session when exists', () => {
      const created = startSession('chat-1', '/tmp/workdir')
      const retrieved = getSession('chat-1')

      expect(retrieved).toBe(created)
    })

    test('returns undefined for non-existent session', () => {
      const session = getSession('non-existent')

      expect(session).toBeUndefined()
    })
  })

  describe('process exit event', () => {
    test('cleans up session from Map on exit', () => {
      startSession('chat-1', '/tmp/workdir')
      expect(getSession('chat-1')).toBeDefined()

      mockProcess.emit('exit', 0, null)

      expect(getSession('chat-1')).toBeUndefined()
    })

    test('invokes exit callback with code and signal', () => {
      const exitCallback = mock(() => {})
      setSessionExitCallback(exitCallback)

      startSession('chat-1', '/tmp/workdir')
      mockProcess.emit('exit', 1, 'SIGTERM')

      expect(exitCallback).toHaveBeenCalledWith('chat-1', 1, 'SIGTERM')
    })

    test('cleans up session on error event', () => {
      startSession('chat-1', '/tmp/workdir')
      expect(getSession('chat-1')).toBeDefined()

      mockProcess.emit('error', new Error('spawn failed'))

      expect(getSession('chat-1')).toBeUndefined()
    })
  })

  describe('updateSessionActivity', () => {
    test('updates lastActivityAt timestamp', async () => {
      const session = startSession('chat-1', '/tmp/workdir')
      const originalTime = session.lastActivityAt.getTime()

      await new Promise((resolve) => setTimeout(resolve, 10))

      const result = updateSessionActivity('chat-1')

      expect(result).toBe(true)
      expect(session.lastActivityAt.getTime()).toBeGreaterThan(originalTime)
    })

    test('returns false for non-existent session', () => {
      const result = updateSessionActivity('non-existent')

      expect(result).toBe(false)
    })
  })

  describe('getAllSessions', () => {
    test('returns empty array when no sessions', () => {
      expect(getAllSessions()).toEqual([])
    })

    test('returns all active sessions', () => {
      startSession('chat-1', '/tmp/first')

      mockProcess = new MockChildProcess()
      spawnSpy.mockReturnValue(mockProcess as unknown as childProcess.ChildProcess)
      startSession('chat-2', '/tmp/second')

      const sessions = getAllSessions()

      expect(sessions).toHaveLength(2)
      expect(sessions.map((s) => s.chatId).sort()).toEqual(['chat-1', 'chat-2'])
    })
  })

  describe('clearSessionsMap', () => {
    test('clears all sessions without killing processes', () => {
      startSession('chat-1', '/tmp/workdir')

      clearSessionsMap()

      expect(getAllSessions()).toEqual([])
      expect(mockProcess.killed).toBe(false)
    })
  })

  describe('session timeout', () => {
    test('getSessionTimeoutMs returns configured timeout', () => {
      const timeout = getSessionTimeoutMs()
      expect(timeout).toBeGreaterThan(0)
    })

    test('getCleanupIntervalMs returns 60 seconds', () => {
      expect(getCleanupIntervalMs()).toBe(60 * 1000)
    })

    test('timeout callback is invoked when session is inactive', async () => {
      const timeoutCallback = mock(() => {})
      setSessionTimeoutCallback(timeoutCallback)

      const session = startSession('chat-1', '/tmp/workdir')
      session.lastActivityAt = new Date(Date.now() - getSessionTimeoutMs() - 1000)

      const captured: { fn: (() => void) | null } = { fn: null }
      const originalSetInterval = globalThis.setInterval
      ;(globalThis as unknown as { setInterval: typeof setInterval }).setInterval = ((fn: () => void) => {
        captured.fn = fn
        return 999
      }) as unknown as typeof setInterval

      startSessionCleanup()
      captured.fn?.()

      ;(globalThis as unknown as { setInterval: typeof setInterval }).setInterval = originalSetInterval

      expect(timeoutCallback).toHaveBeenCalledWith('chat-1')
      expect(getSession('chat-1')).toBeUndefined()
    })

    test('session is not timed out when recently active', () => {
      const timeoutCallback = mock(() => {})
      setSessionTimeoutCallback(timeoutCallback)

      startSession('chat-1', '/tmp/workdir')
      updateSessionActivity('chat-1')

      const captured: { fn: (() => void) | null } = { fn: null }
      const originalSetInterval = globalThis.setInterval
      ;(globalThis as unknown as { setInterval: typeof setInterval }).setInterval = ((fn: () => void) => {
        captured.fn = fn
        return 999
      }) as unknown as typeof setInterval

      startSessionCleanup()
      captured.fn?.()

      ;(globalThis as unknown as { setInterval: typeof setInterval }).setInterval = originalSetInterval

      expect(timeoutCallback).not.toHaveBeenCalled()
      expect(getSession('chat-1')).toBeDefined()
    })

    test('startSessionCleanup only starts one interval', () => {
      const originalSetInterval = globalThis.setInterval
      let callCount = 0
      ;(globalThis as unknown as { setInterval: typeof setInterval }).setInterval = (() => {
        callCount++
        return 999
      }) as unknown as typeof setInterval

      startSessionCleanup()
      startSessionCleanup()
      startSessionCleanup()

      ;(globalThis as unknown as { setInterval: typeof setInterval }).setInterval = originalSetInterval

      expect(callCount).toBe(1)
    })
  })
})
