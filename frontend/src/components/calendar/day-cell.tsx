'use client'

import { cn } from '@/lib/utils'

interface DayCellProps {
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  posts: { id: string; status: string; platforms: string[] }[]
  onClick?: () => void
}

export function DayCell({ day, isCurrentMonth, isToday, posts, onClick }: DayCellProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-start p-2 min-h-[80px] lg:h-24 transition-all',
        isCurrentMonth ? 'bg-canvas hover:bg-black/5' : 'bg-surface-soft/50 hover:bg-surface-soft',
        isToday && 'bg-badge-violet/5 ring-1 ring-inset ring-badge-violet/30',
      )}
    >
      <span
        className={cn(
          'text-[13px] font-medium leading-none',
          isToday ? 'text-badge-violet font-semibold' : isCurrentMonth ? 'text-ink' : 'text-muted/50',
        )}
      >
        {day}
      </span>
      <div className="flex flex-wrap gap-1 mt-2">
        {posts.slice(0, 3).map((post) => (
          <span
            key={post.id}
            className={cn(
              'w-2 h-2 rounded-full',
              post.status === 'published' ? 'bg-success' :
              post.status === 'failed' ? 'bg-error' : 'bg-badge-violet',
            )}
          />
        ))}
        {posts.length > 3 && (
          <span className="text-[10px] text-muted font-medium mt-[-2px]">+{posts.length - 3}</span>
        )}
      </div>
    </button>
  )
}
