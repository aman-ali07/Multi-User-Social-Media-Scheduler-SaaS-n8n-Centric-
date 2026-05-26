'use client'

import { cn } from '@/lib/utils'

interface CalendarPost {
  id: string
  status: string
  platforms: string[]
}

interface DayCellProps {
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  posts: CalendarPost[]
  onClick?: () => void
}

export function DayCell({ day, isCurrentMonth, isToday, posts, onClick }: DayCellProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-start p-1.5 h-24 rounded-sm border transition-all',
        isCurrentMonth ? 'border-border bg-surface' : 'border-border/50 bg-surface/50',
        isToday && 'border-gold/40 bg-gold/5',
        'hover:border-gold/30 hover:bg-gold/[0.02]',
      )}
    >
      <span
        className={cn(
          'text-[11px] font-mono leading-none',
          isToday ? 'text-gold font-bold' : isCurrentMonth ? 'text-text' : 'text-text-dim',
        )}
      >
        {day}
      </span>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {posts.slice(0, 3).map((post) => (
          <span
            key={post.id}
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              post.status === 'published' ? 'bg-lime' :
              post.status === 'failed' ? 'bg-red' : 'bg-gold',
            )}
          />
        ))}
        {posts.length > 3 && (
          <span className="text-[8px] text-text-dim font-mono">+{posts.length - 3}</span>
        )}
      </div>
    </button>
  )
}
