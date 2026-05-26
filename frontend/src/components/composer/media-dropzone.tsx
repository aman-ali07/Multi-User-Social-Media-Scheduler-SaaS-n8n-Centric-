'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface MediaDropzoneProps {
  onFile: (file: File) => void
  accept?: string
}

export function MediaDropzone({ onFile, accept = 'image/*,video/*' }: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[12px] text-text-dim font-mono uppercase tracking-wider">
        Media
      </label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all',
          dragging
            ? 'border-gold/50 bg-gold/5'
            : 'border-border hover:border-gold/30 bg-surface',
        )}
      >
        <p className="text-text-muted text-sm font-sans">
          Drop media here or click to browse
        </p>
        <p className="text-text-dim text-[11px] font-mono mt-1">JPG, PNG, GIF, MP4</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
