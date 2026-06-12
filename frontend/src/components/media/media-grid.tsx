'use client'

import type { MediaAsset } from '@/types/database'

interface MediaGridProps {
  items: MediaAsset[]
  onDelete?: (id: string) => void
}

export function MediaGrid({ items, onDelete }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-border bg-surface p-12 text-center">
        <p className="text-text-dim text-sm font-sans">No media uploaded yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((asset) => (
        <div
          key={asset.id}
          className="group relative rounded-sm border border-border bg-surface overflow-hidden aspect-square"
        >
          {asset.file_type.startsWith('video') ? (
            <video src={asset.file_url} className="w-full h-full object-cover" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.file_url} alt="" className="w-full h-full object-cover" />
            </>
          )}
          <div className="absolute inset-0 bg-bg/0 group-hover:bg-bg/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            {onDelete && (
              <button
                onClick={() => onDelete(asset.id)}
                className="text-[11px] text-red font-mono uppercase tracking-wider border border-red/30 bg-red/10 px-2 py-1 rounded-sm hover:bg-red/20 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-bg/80 to-transparent">
            <p className="text-[9px] text-text-dim font-mono truncate">
              {asset.file_type.split('/')[0]} · {asset.file_size ? `${(asset.file_size / 1024).toFixed(0)}KB` : '--'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
