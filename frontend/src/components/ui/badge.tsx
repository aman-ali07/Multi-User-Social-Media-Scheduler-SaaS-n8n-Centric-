import { cn } from '@/lib/utils'
import type { PostStatus, AccountStatus, LogStatus } from '@/types/database'

interface BadgeProps {
  variant?: PostStatus | AccountStatus | LogStatus | 'default'
  className?: string
  children?: React.ReactNode
}

const variantStyles: Record<string, string> = {
  draft: 'bg-surface-2 text-text-muted border-border',
  scheduled: 'bg-gold/10 text-gold border-gold/20',
  published: 'bg-lime/10 text-lime border-lime/20',
  failed: 'bg-red/10 text-red border-red/20',
  cancelled: 'bg-surface-2 text-text-dim border-border',
  active: 'bg-lime/10 text-lime border-lime/20',
  expired: 'bg-orange/10 text-orange border-orange/20',
  revoked: 'bg-red/10 text-red border-red/20',
  success: 'bg-lime/10 text-lime border-lime/20',
  error: 'bg-red/10 text-red border-red/20',
  retry: 'bg-orange/10 text-orange border-orange/20',
  default: 'bg-surface-2 text-text-muted border-border',
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  const label = children || variant
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-medium border font-mono uppercase tracking-wider',
        variantStyles[variant] || variantStyles.default,
        className,
      )}
    >
      {label}
    </span>
  )
}
