'use client'

interface SchedulePickerProps {
  value: string
  onChange: (value: string) => void
}

export function SchedulePicker({ value, onChange }: SchedulePickerProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="scheduleAt" className="text-[12px] text-text-dim font-mono uppercase tracking-wider">
        Schedule for (optional)
      </label>
      <input
        id="scheduleAt"
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-gold/50 font-sans [color-scheme:dark]"
      />
    </div>
  )
}
