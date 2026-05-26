'use client'

interface CaptionEditorProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

export function CaptionEditor({ value, onChange, maxLength = 2200 }: CaptionEditorProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="caption" className="text-[12px] text-text-dim font-mono uppercase tracking-wider">
          Caption
        </label>
        <span className={`text-[10px] font-mono ${value.length > maxLength * 0.9 ? 'text-orange' : 'text-text-dim'}`}>
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        id="caption"
        placeholder="Write your post caption..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        maxLength={maxLength}
        className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-dim/40 resize-none focus:outline-none focus:ring-1 focus:ring-gold/50 transition-all font-sans"
      />
    </div>
  )
}
