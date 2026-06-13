'use client'

interface PlatformSelectorProps {
  platforms: string[]
  onToggle: (platform: string) => void
}

const options = ['facebook', 'instagram']

export function PlatformSelector({ platforms, onToggle }: PlatformSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[14px] font-medium text-ink tracking-wide">
        Platforms
      </label>
      <div className="flex gap-2">
        {options.map((p) => (
          <button
            key={p}
            onClick={() => onToggle(p)}
            className={`px-4 py-2 rounded-md text-[13px] font-medium uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
              platforms.includes(p)
                ? 'bg-ink text-canvas shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_2px_10px_rgba(0,0,0,0.1)]'
                : 'bg-surface-card text-muted hover:text-ink hover:bg-black/5 shadow-sm'
            }`}
          >
            {p === 'facebook' ? 'FB' : 'IG'}
          </button>
        ))}
      </div>
    </div>
  )
}
