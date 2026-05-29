'use client'

import { DayCell } from './day-cell'

interface CalendarPost {
  id: string
  status: string
  platforms: string[]
  schedule_at: string | null
  published_at: string | null
}

interface CalendarGridProps {
  year: number
  month: number
  postsByDate: Record<string, CalendarPost[]>
  onDayClick?: (date: string) => void
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarGrid({ year, month, postsByDate, onDayClick }: CalendarGridProps) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const today = new Date()

  const cells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = []

  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startPad - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const dateStr = new Date(year, month - 1, d).toISOString().split('T')[0]
    cells.push({ day: d, isCurrentMonth: false, dateStr })
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = new Date(year, month, d).toISOString().split('T')[0]
    cells.push({ day: d, isCurrentMonth: true, dateStr })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const dateStr = new Date(year, month + 1, d).toISOString().split('T')[0]
    cells.push({ day: d, isCurrentMonth: false, dateStr })
  }

  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div className="rounded-sm border border-border bg-surface overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-7 border-b border-border">
          {dayLabels.map((label) => (
            <div key={label} className="px-2 py-2 text-[10px] text-text-muted font-mono uppercase tracking-wider text-center">
              {label}
            </div>
          ))}
        </div>
        <div className="divide-y divide-border">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 divide-x divide-border">
              {week.map((cell, ci) => {
                const isToday =
                  cell.isCurrentMonth &&
                  cell.day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear()

                const posts = postsByDate[cell.dateStr] || []

                return (
                  <DayCell
                    key={`${wi}-${ci}`}
                    day={cell.day}
                    isCurrentMonth={cell.isCurrentMonth}
                    isToday={isToday}
                    posts={posts.map((p) => ({ id: p.id, status: p.status, platforms: p.platforms }))}
                    onClick={() => onDayClick?.(cell.dateStr)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
