'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { Button } from '@/components/ui/button'
import { useCalendar } from '@/hooks/use-calendar'

const container = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.06 } },
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
        <motion.div variants={container} initial="hidden" animate="visible" className="p-6 space-y-6 max-w-5xl">
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
            <motion.div variants={item} className="flex items-center gap-2 text-text-dim text-sm font-mono">
              <span className="w-3 h-3 border border-gold/30 border-t-gold rounded-full animate-spin" />
              Loading calendar...
            </motion.div>
          ) : (
            <motion.div variants={item}>
              <CalendarGrid
                year={year}
                month={month}
                postsByDate={postsByDate}
                onDayClick={(date) => console.log('Day clicked:', date)}
              />
            </motion.div>
          )}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
