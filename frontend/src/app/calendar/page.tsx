'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { Button } from '@/components/ui/button'
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
        <motion.div variants={container} initial="hidden" animate="visible" className="p-6 sm:p-10 space-y-8 max-w-5xl mx-auto">
          <motion.div variants={item} className="flex items-center justify-between">
            <div>
              <h1 className="font-cal text-[36px] text-ink leading-none">Schedule</h1>
              <p className="text-muted text-sm mt-2 font-medium">Calendar overview</p>
            </div>
          </motion.div>

          <motion.div variants={item} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={prevMonth}>◀</Button>
              <span className="text-[20px] font-cal text-ink min-w-[180px] text-center">
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
                  <div key={i} className="h-24 rounded-lg border border-hairline bg-surface-card animate-pulse p-2">
                    <div className="w-5 h-3 rounded-md bg-surface-strong" />
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
              <motion.div variants={item} className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted font-medium uppercase tracking-wider">Legend</span>
                  <div className="flex items-center gap-3 ml-2">
                    {[
                      { label: 'Scheduled', color: 'bg-badge-violet' },
                      { label: 'Published', color: 'bg-success' },
                      { label: 'Failed', color: 'bg-error' },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                        <span className="text-[12px] text-muted font-medium">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-muted font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-badge-violet/30" />
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
