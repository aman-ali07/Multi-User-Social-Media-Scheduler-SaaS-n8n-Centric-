'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { Button } from '@/components/ui/button'
import { SkeletonGrid } from '@/components/ui/skeleton'
import { useCalendar } from '@/hooks/use-calendar'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function CalendarPage() {
  const router = useRouter()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const { postsByDate, loading } = useCalendar(year, month)

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const goToday = () => {
    const n = new Date()
    setYear(n.getFullYear())
    setMonth(n.getMonth())
  }

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-4 sm:p-6 space-y-6 max-w-5xl">
          <motion.div variants={item} className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-[28px] text-text tracking-tight">Schedule</h1>
              <p className="text-text-muted text-sm font-sans mt-1">Calendar overview</p>
            </div>
          </motion.div>

          <motion.div variants={item} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={prevMonth}>◀</Button>
              <span className="text-[16px] font-serif text-text min-w-[180px] text-center">
                {monthNames[month]} {year}
              </span>
              <Button variant="ghost" size="sm" onClick={nextMonth}>▶</Button>
            </div>
            <Button variant="secondary" size="sm" onClick={goToday}>Today</Button>
          </motion.div>

          {loading ? (
            <motion.div variants={item}>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-sm border border-border bg-surface animate-pulse p-1.5">
                    <div className="w-5 h-3 rounded-sm bg-surface-2" />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div variants={item}>
                <CalendarGrid
                  year={year}
                  month={month}
                  postsByDate={postsByDate}
                  onDayClick={(date) => router.push(`/posts?date=${date}`)}
                />
              </motion.div>
              <motion.div variants={item} className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-dim font-mono uppercase tracking-wider">Legenda</span>
                  <div className="flex items-center gap-2">
                    {[
                      { label: 'Scheduled', color: 'bg-gold' },
                      { label: 'Published', color: 'bg-lime' },
                      { label: 'Failed', color: 'bg-red' },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${l.color}`} />
                        <span className="text-[10px] text-text-muted font-mono">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-dim font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                  {Object.values(postsByDate).flat().length} scheduled
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
