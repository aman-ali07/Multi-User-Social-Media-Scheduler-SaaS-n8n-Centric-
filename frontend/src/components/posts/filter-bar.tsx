'use client'

const statusTabs = ['all', 'draft', 'scheduled', 'published', 'failed'] as const

interface FilterBarProps {
  active: string
  onChange: (tab: string) => void
}

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 border-b border-border pb-2 flex-nowrap min-w-max">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider rounded-sm whitespace-nowrap transition-all ${
              active === tab
                ? 'text-gold bg-gold/10'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  )
}
