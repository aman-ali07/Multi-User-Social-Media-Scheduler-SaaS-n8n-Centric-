'use client'

interface PlatformSelectorProps {
  platforms: string[]
  onToggle: (platform: string) => void
}

const options = ['facebook', 'instagram']

export function PlatformSelector({ platforms, onToggle }: PlatformSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] text-text-dim font-mono uppercase tracking-wider">
        Platforms
      </label>
      <div className="flex gap-2">
        {options.map((p) => (
          <button
            key={p}
            onClick={() => onToggle(p)}
            className={`px-3 py-1.5 rounded-sm text-[12px] font-mono uppercase tracking-wider border transition-all ${
              platforms.includes(p)
                ? 'border-gold/50 bg-gold/10 text-gold'
                : 'border-border text-text-muted hover:text-text'
            }`}
          >
            {p === 'facebook' ? 'FB' : 'IG'}
          </button>
        ))}
      </div>
    </div>
  )
}
