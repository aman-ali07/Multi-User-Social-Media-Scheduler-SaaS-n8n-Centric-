'use client'

import type { MediaAsset } from '@/types/database'
import { Trash2, Link2, Film, Image as ImageIcon, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-[12px] text-canvas font-medium hover:text-white transition-all transform active:scale-95"
    >
      {copied ? (
        <CheckCircle2 className="w-4 h-4 text-success transition-transform duration-300 scale-110" />
      ) : (
        <Link2 className="w-4 h-4 transition-transform duration-300" />
      )}
      {copied ? 'Copied!' : 'Copy URL'}
    </button>
  )
}

interface MediaGridProps {
  items: MediaAsset[]
  onDelete?: (id: string) => void
}

import { motion } from 'framer-motion'

export function MediaGrid({ items, onDelete }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 rounded-xl border border-dashed border-hairline bg-surface-card/50 relative">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [2, -2, 2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-soft to-canvas border border-hairline shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex items-center justify-center"
        >
          <ImageIcon className="w-6 h-6 text-muted" />
        </motion.div>
        <h3 className="font-cal text-[20px] text-ink mb-2">No media uploaded</h3>
        <p className="text-muted text-[14px] font-medium max-w-sm text-center tracking-wide">Drag and drop your images or videos here, or click the upload button to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 border-t border-l border-hairline">
      {items.map((asset) => (
        <div
          key={asset.id}
          className="group relative border-r border-b border-hairline bg-surface-card aspect-square overflow-hidden"
        >
          {asset.file_type.startsWith('video') ? (
            <video src={asset.file_url} className="w-full h-full object-cover" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.file_url} alt="" className="w-full h-full object-cover" />
            </>
          )}
          
          <div className="absolute inset-0 bg-ink/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
            <CopyButton url={asset.file_url} />
            {onDelete && (
              <button
                onClick={() => onDelete(asset.id)}
                className="flex items-center gap-2 text-[12px] text-error font-medium hover:text-error/80 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          
          <div className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded bg-ink/50 backdrop-blur-md">
             {asset.file_type.startsWith('video') ? <Film className="w-3 h-3 text-canvas" /> : <ImageIcon className="w-3 h-3 text-canvas" />}
          </div>
        </div>
      ))}
    </div>
  )
}
