import { spawn, type ChildProcess } from 'child_process'

const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || String(30 * 60 * 1000), 10)
const CLEANUP_INTERVAL_MS = 60 * 1000

export interface OpenCodeSession {
  chatId: string
  process: ChildProcess
  workdir: string
  startedAt: Date
  lastActivityAt: Date
}

/**
 * In-memory storage of active sessions, keyed by chatId
 */
const sessions = new Map<string, OpenCodeSession>()

export type SessionExitCallback = (chatId: string, code: number | null, signal: NodeJS.Signals | null) => void
export type SessionTimeoutCallback = (chatId: string) => void

let onSessionExit: SessionExitCallback | undefined
let onSessionTimeout: SessionTimeoutCallback | undefined

export function setSessionExitCallback(callback: SessionExitCallback | undefined): void {
  onSessionExit = callback
}

export function setSessionTimeoutCallback(callback: SessionTimeoutCallback | undefined): void {
  onSessionTimeout = callback
}

/**
 * Start a new OpenCode session for a chat.
 * If a session already exists for this chat, it will be stopped first.
 *
 * @param chatId - Unique identifier for the chat
 * @param workdir - Working directory path for the OpenCode process
 * @returns The created session
 */
export function startSession(chatId: string, workdir: string): OpenCodeSession {
  const existing = sessions.get(chatId)
  if (existing) {
    stopSession(chatId)
  }

  const now = new Date()

  const process = spawn('opencode', ['acp'], {
    cwd: workdir,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  const session: OpenCodeSession = {
    chatId,
    process,
    workdir,
    startedAt: now,
    lastActivityAt: now,
  }

  process.on('exit', (code, signal) => {
    sessions.delete(chatId)
    onSessionExit?.(chatId, code, signal)
  })

  process.on('error', () => {
    sessions.delete(chatId)
  })

  sessions.set(chatId, session)
  return session
}

/**
 * Stop and cleanup an OpenCode session.
 *
 * @param chatId - The chat ID whose session should be stopped
 * @returns true if a session was stopped, false if no session existed
 */
export function stopSession(chatId: string): boolean {
  const session = sessions.get(chatId)
  if (!session) {
    return false
  }

  session.process.kill()
  sessions.delete(chatId)

  return true
}

/**
 * Get session info for a chat.
 *
 * @param chatId - The chat ID to look up
 * @returns The session if it exists, undefined otherwise
 */
export function getSession(chatId: string): OpenCodeSession | undefined {
  return sessions.get(chatId)
}

/**
 * Update the lastActivityAt timestamp for a session.
 * Used to track session activity for timeout purposes.
 *
 * @param chatId - The chat ID whose session should be updated
 * @returns true if session was updated, false if not found
 */
export function updateSessionActivity(chatId: string): boolean {
  const session = sessions.get(chatId)
  if (!session) {
    return false
  }
  session.lastActivityAt = new Date()
  return true
}

/**
 * Get all active sessions.
 * Useful for cleanup operations or monitoring.
 *
 * @returns Array of all active sessions
 */
export function getAllSessions(): OpenCodeSession[] {
  return Array.from(sessions.values())
}

export function clearSessionsMap(): void {
  sessions.clear()
}

function cleanupTimedOutSessions(): void {
  const now = Date.now()
  for (const [chatId, session] of sessions) {
    if (now - session.lastActivityAt.getTime() > SESSION_TIMEOUT_MS) {
      onSessionTimeout?.(chatId)
      stopSession(chatId)
    }
  }
}

let cleanupIntervalId: ReturnType<typeof setInterval> | null = null

export function startSessionCleanup(): void {
  if (cleanupIntervalId) return
  cleanupIntervalId = setInterval(cleanupTimedOutSessions, CLEANUP_INTERVAL_MS)
}

export function stopSessionCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId)
    cleanupIntervalId = null
  }
}

export function getSessionTimeoutMs(): number {
  return SESSION_TIMEOUT_MS
}

export function getCleanupIntervalMs(): number {
  return CLEANUP_INTERVAL_MS
}
