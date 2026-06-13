'use client'

interface SchedulePickerProps {
  value: string
  onChange: (value: string) => void
}

export function SchedulePicker({ value, onChange }: SchedulePickerProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="scheduleAt" className="text-[14px] font-medium text-ink tracking-wide">
        Schedule for (optional)
      </label>
      <input
        id="scheduleAt"
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-canvas px-3 py-2.5 text-[14px] text-ink border border-hairline focus:outline-none focus:ring-2 focus:ring-ink/20 focus:ring-offset-1 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] [color-scheme:light]"
      />
    </div>
  )
}
