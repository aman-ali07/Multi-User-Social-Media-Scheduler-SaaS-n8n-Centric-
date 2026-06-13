import { cn } from '@/lib/utils'
import type { PostStatus, AccountStatus, LogStatus } from '@/types/database'

interface BadgeProps {
  variant?: PostStatus | AccountStatus | LogStatus | 'default'
  className?: string
  children?: React.ReactNode
}

const variantStyles: Record<string, string> = {
  draft: 'bg-surface-strong/50 text-muted',
  scheduled: 'bg-badge-violet/10 text-badge-violet',
  published: 'bg-success/10 text-success',
  failed: 'bg-error/10 text-error',
  cancelled: 'bg-surface-strong/50 text-muted',
  active: 'bg-success/10 text-success',
  expired: 'bg-badge-orange/10 text-badge-orange',
  revoked: 'bg-error/10 text-error',
  disconnected: 'bg-surface-strong/50 text-muted',
  success: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
  retry: 'bg-badge-orange/10 text-badge-orange',
  default: 'bg-surface-strong/50 text-muted',
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  const label = children || variant
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium',
        variantStyles[variant] || variantStyles.default,
        className,
      )}
    >
      {label}
    </span>
  )
}
