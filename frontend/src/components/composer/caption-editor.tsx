'use client'

import { useRef, useEffect } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import gsap from 'gsap'

interface CaptionEditorProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

export function CaptionEditor({ value, onChange, maxLength = 2200 }: CaptionEditorProps) {
  const counterRef = useRef<HTMLDivElement>(null)
  
  // Physical tension effect when nearing or exceeding limits
  useEffect(() => {
    if (!counterRef.current) return
    const ratio = value.length / maxLength
    
    if (ratio > 0.95 && ratio <= 1) {
      // Subtle heartbeat when close
      gsap.to(counterRef.current, { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1 })
    } else if (ratio > 1) {
      // Violent mechanical shake when exceeding
      gsap.fromTo(counterRef.current, 
        { x: -2 },
        { x: 2, duration: 0.05, repeat: 5, yoyo: true, ease: 'power1.inOut' }
      )
    }
  }, [value, maxLength])

  return (
    <div className="relative group p-4 -mx-4 rounded-md transition-all focus-within:bg-canvas focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus-within:ring-2 focus-within:ring-ink/20">
      <TextareaAutosize
        id="caption"
        placeholder="Start writing..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minRows={8}
        className="w-full bg-transparent px-0 py-2 text-[16px] leading-relaxed text-ink placeholder:text-muted/40 resize-none focus:outline-none min-h-[200px]"
      />
      <div 
        ref={counterRef}
        className={`absolute bottom-0 right-0 text-[11px] font-medium transition-opacity duration-300 ${
          value.length > maxLength * 0.9 ? 'text-error opacity-100' : 'text-muted opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
        }`}
      >
        <span className="tabular-nums">{value.length}</span>/{maxLength}
      </div>
    </div>
  )
}
