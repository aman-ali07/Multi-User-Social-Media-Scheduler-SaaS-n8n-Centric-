'use client'

import { Badge } from '@/components/ui/badge'
import type { PostLog } from '@/types/database'

interface ActivityTimelineProps {
  logs: PostLog[]
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-sm border border-border bg-surface p-8 text-center">
        <p className="text-text-dim text-sm font-sans">No activity recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-sm border border-border bg-surface divide-y divide-border">
      {logs.map((log) => (
        <div key={log.id} className="p-3 flex items-start gap-3">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
            log.status === 'success' ? 'bg-lime' :
            log.status === 'error' ? 'bg-red' : 'bg-orange'
          }`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-text font-mono">{log.workflow_name}</span>
              <Badge variant={log.status} />
            </div>
            {log.error_message && (
              <p className="text-[11px] text-red/80 font-sans mt-0.5">{log.error_message}</p>
            )}
            <p className="text-[10px] text-text-dim font-mono mt-0.5">
              Attempt {log.attempt_number} — {new Date(log.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
