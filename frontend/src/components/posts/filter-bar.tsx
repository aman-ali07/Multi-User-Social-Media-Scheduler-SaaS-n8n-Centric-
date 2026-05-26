'use client'

const statusTabs = ['all', 'draft', 'scheduled', 'published', 'failed'] as const

interface FilterBarProps {
  active: string
  onChange: (tab: string) => void
}

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-1 border-b border-border pb-2">
      {statusTabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-sm transition-all ${
            active === tab
              ? 'text-gold bg-gold/10'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
