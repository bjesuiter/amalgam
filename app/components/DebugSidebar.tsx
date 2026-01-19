import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { ChevronRight, ChevronLeft, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export interface DebugLogEntry {
  id: string
  timestamp: Date
  direction: 'sent' | 'received'
  method: string
  payload: unknown
  isError?: boolean
}

export interface SessionInfo {
  pid?: number
  acpSessionId?: string
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  workdir?: string
}

interface DebugSidebarProps {
  isOpen: boolean
  onToggle: () => void
  sessionInfo: SessionInfo
  logs: DebugLogEntry[]
  onClearLogs: () => void
  className?: string
}

export function DebugSidebar({
  isOpen,
  onToggle,
  sessionInfo,
  logs,
  onClearLogs,
  className,
}: DebugSidebarProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const toggleLogExpanded = (id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-l bg-muted/30 transition-all duration-200',
        isOpen ? 'w-96' : 'w-0 overflow-hidden',
        className
      )}
    >
      {isOpen && (
        <>
          <div className="flex h-14 items-center justify-between border-b px-4">
            <span className="text-sm font-semibold">Debug Panel</span>
            <Button variant="ghost" size="icon" onClick={onToggle}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-b p-4">
            <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Session Info
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-xs font-medium',
                    sessionInfo.connectionStatus === 'connected' &&
                      'bg-green-500/20 text-green-600',
                    sessionInfo.connectionStatus === 'disconnected' &&
                      'bg-red-500/20 text-red-600',
                    sessionInfo.connectionStatus === 'connecting' &&
                      'bg-yellow-500/20 text-yellow-600'
                  )}
                >
                  {sessionInfo.connectionStatus}
                </span>
              </div>
              {sessionInfo.pid && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PID</span>
                  <span className="font-mono text-xs">{sessionInfo.pid}</span>
                </div>
              )}
              {sessionInfo.acpSessionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session ID</span>
                  <span className="max-w-[150px] truncate font-mono text-xs">
                    {sessionInfo.acpSessionId}
                  </span>
                </div>
              )}
              {sessionInfo.workdir && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Workdir</span>
                  <span className="max-w-[150px] truncate font-mono text-xs">
                    {sessionInfo.workdir}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="text-xs font-medium uppercase text-muted-foreground">
                ACP Traffic ({logs.length})
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClearLogs}
                title="Clear logs"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No ACP traffic yet
                </p>
              ) : (
                <div className="space-y-1">
                  {logs.slice(-100).map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        'rounded border p-2 text-xs',
                        log.isError && 'border-red-500/50 bg-red-500/10',
                        !log.isError &&
                          log.direction === 'sent' &&
                          'border-blue-500/30 bg-blue-500/5',
                        !log.isError &&
                          log.direction === 'received' &&
                          'border-green-500/30 bg-green-500/5'
                      )}
                    >
                      <div
                        className="flex cursor-pointer items-center gap-2"
                        onClick={() => toggleLogExpanded(log.id)}
                      >
                        <span
                          className={cn(
                            'font-bold',
                            log.direction === 'sent' && 'text-blue-500',
                            log.direction === 'received' && 'text-green-500',
                            log.isError && 'text-red-500'
                          )}
                        >
                          {log.direction === 'sent' ? '→' : '←'}
                        </span>
                        <span className="text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className="font-medium">{log.method}</span>
                        <span className="ml-auto">
                          {expandedLogs.has(log.id) ? (
                            <ChevronLeft className="h-3 w-3 rotate-90" />
                          ) : (
                            <ChevronLeft className="h-3 w-3 -rotate-90" />
                          )}
                        </span>
                      </div>
                      {expandedLogs.has(log.id) && (
                        <pre className="mt-2 max-h-48 overflow-auto rounded bg-background/50 p-2 font-mono text-[10px]">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
