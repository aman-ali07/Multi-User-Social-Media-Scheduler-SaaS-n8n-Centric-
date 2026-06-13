'use client'

const statusTabs = ['all', 'draft', 'scheduled', 'published', 'failed'] as const

interface FilterBarProps {
  active: string
  onChange: (tab: string) => void
}

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="inline-flex bg-surface-card border border-hairline p-1 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {statusTabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-3 py-1.5 text-[12px] font-bold uppercase tracking-widest rounded transition-all ${
            active === tab
              ? 'bg-canvas text-ink shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-hairline/60'
              : 'text-muted hover:text-ink hover:bg-hairline/30 border border-transparent'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
