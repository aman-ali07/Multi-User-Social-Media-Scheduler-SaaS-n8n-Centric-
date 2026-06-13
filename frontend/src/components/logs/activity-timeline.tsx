'use client'

import { Badge } from '@/components/ui/badge'
import type { PostLog } from '@/types/database'

interface ActivityTimelineProps {
  logs: PostLog[]
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface-card p-12 text-center shadow-sm">
        <p className="text-muted text-[15px] font-medium">No activity recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface-card divide-y divide-hairline shadow-sm">
      {logs.map((log) => (
        <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-black/5 transition-colors">
          <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
            log.status === 'success' ? 'bg-success' :
            log.status === 'error' ? 'bg-error' : 'bg-badge-orange'
          }`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-[14px] text-ink font-medium">{log.workflow_name}</span>
              <Badge variant={log.status} />
            </div>
            {log.error_message && (
              <p className="text-[13px] text-error/80 font-medium mt-1">{log.error_message}</p>
            )}
            <p className="text-[12px] text-muted font-medium mt-1">
              Attempt {log.attempt_number} — {new Date(log.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
