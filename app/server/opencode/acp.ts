import { EventEmitter } from 'events'
import type { ChildProcess } from 'child_process'

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params?: Record<string, unknown>
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: number
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

export interface JsonRpcNotification {
  jsonrpc: '2.0'
  method: string
  params?: Record<string, unknown>
}

export interface InitializeParams {
  protocolVersion: number
  clientCapabilities: {
    fs?: { readTextFile?: boolean; writeTextFile?: boolean }
    terminal?: boolean
  }
  clientInfo: { name: string; title: string; version: string }
}

export interface InitializeResult {
  protocolVersion: number
  agentCapabilities: {
    loadSession?: boolean
    promptCapabilities?: { image?: boolean; audio?: boolean; embeddedContext?: boolean }
    mcp?: { http?: boolean; sse?: boolean }
  }
  agentInfo?: { name: string; title: string; version: string }
}

export interface SessionNewParams {
  cwd: string
  mcpServers?: Array<{
    name: string
    command: string
    args: string[]
    env?: Array<{ name: string; value: string }>
  }>
}

export interface SessionNewResult {
  sessionId: string
}

export interface ContentBlock {
  type: 'text' | 'image' | 'audio' | 'resource' | 'resource_link'
  text?: string
  data?: string
  mimeType?: string
  resource?: { uri: string; text?: string; blob?: string; mimeType?: string }
  uri?: string
  name?: string
}

export interface SessionPromptParams {
  sessionId: string
  prompt: ContentBlock[]
}

export interface SessionPromptResult {
  stopReason: 'end_turn' | 'max_tokens' | 'max_turn_requests' | 'refusal' | 'cancelled'
}

export type SessionUpdateType =
  | 'plan'
  | 'agent_message_chunk'
  | 'user_message_chunk'
  | 'tool_call'
  | 'tool_call_update'

export interface SessionUpdate {
  sessionId: string
  update: {
    sessionUpdate: SessionUpdateType
    content?: ContentBlock
    toolCallId?: string
    title?: string
    kind?: string
    status?: 'pending' | 'in_progress' | 'completed' | 'failed'
    entries?: Array<{ content: string; priority: string; status: string }>
  }
}

export interface DebugLogEntry {
  id: number
  timestamp: Date
  method: string
  params?: unknown
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
  direction: 'sent' | 'received'
}

export interface ACPClientEvents {
  update: (update: SessionUpdate) => void
  error: (error: Error) => void
  close: () => void
  debugLog: (entry: DebugLogEntry) => void
}

export class ACPClient extends EventEmitter {
  private process: ChildProcess
  private requestId = 0
  private pendingRequests = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void; method: string }
  >()
  private buffer = ''
  private initialized = false

  constructor(process: ChildProcess) {
    super()
    this.process = process
    this.setupStdio()
  }

  private setupStdio(): void {
    if (!this.process.stdout || !this.process.stdin) {
      throw new Error('Process must have stdio pipes')
    }

    this.process.stdout.setEncoding('utf8')
    this.process.stdout.on('data', (data: string) => this.handleData(data))
    this.process.on('close', () => this.emit('close'))
    this.process.on('error', (err) => this.emit('error', err))
  }

  private handleData(data: string): void {
    this.buffer += data
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const message = JSON.parse(line) as JsonRpcResponse | JsonRpcNotification
        this.handleMessage(message)
      } catch {
        this.emit('error', new Error(`Failed to parse JSON-RPC message: ${line}`))
      }
    }
  }

  private handleMessage(message: JsonRpcResponse | JsonRpcNotification): void {
    if ('id' in message && message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id)
      if (pending) {
        this.pendingRequests.delete(message.id)
        
        this.emit('debugLog', {
          id: message.id,
          timestamp: new Date(),
          method: pending.method,
          result: message.result,
          error: message.error,
          direction: 'received' as const,
        })
        
        if (message.error) {
          pending.reject(new Error(message.error.message))
        } else {
          pending.resolve(message.result)
        }
      }
    } else if ('method' in message) {
      if (message.method === 'session/update' && message.params) {
        this.emit('update', message.params as unknown as SessionUpdate)
      }
    }
  }

  private send(message: JsonRpcRequest | JsonRpcNotification): void {
    if (!this.process.stdin) {
      throw new Error('Process stdin not available')
    }
    this.process.stdin.write(JSON.stringify(message) + '\n')
  }

  private request<T>(method: string, params?: object): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId
      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        method,
      })
      
      this.emit('debugLog', {
        id,
        timestamp: new Date(),
        method,
        params,
        direction: 'sent' as const,
      })
      
      this.send({ jsonrpc: '2.0', id, method, params: params as Record<string, unknown> })
    })
  }

  async initialize(): Promise<InitializeResult> {
    const params: InitializeParams = {
      protocolVersion: 1,
      clientCapabilities: {
        fs: { readTextFile: true, writeTextFile: true },
        terminal: false,
      },
      clientInfo: {
        name: 'amalgam',
        title: 'Amalgam',
        version: '1.0.0',
      },
    }

    const result = await this.request<InitializeResult>('initialize', params)
    this.initialized = true
    return result
  }

  async createSession(cwd: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Client not initialized. Call initialize() first.')
    }

    const params: SessionNewParams = { cwd, mcpServers: [] }
    const result = await this.request<SessionNewResult>('session/new', params)
    return result.sessionId
  }

  async sendPrompt(sessionId: string, text: string): Promise<SessionPromptResult> {
    if (!this.initialized) {
      throw new Error('Client not initialized. Call initialize() first.')
    }

    const params: SessionPromptParams = {
      sessionId,
      prompt: [{ type: 'text', text }],
    }
    return this.request<SessionPromptResult>('session/prompt', params)
  }

  cancel(sessionId: string): void {
    this.send({
      jsonrpc: '2.0',
      method: 'session/cancel',
      params: { sessionId },
    })
  }

  close(): void {
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new Error('Client closed'))
      this.pendingRequests.delete(id)
    }
    this.process.stdin?.end()
  }
}

export function createACPClient(process: ChildProcess): ACPClient {
  return new ACPClient(process)
}
