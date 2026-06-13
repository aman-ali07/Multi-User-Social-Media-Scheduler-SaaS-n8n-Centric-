'use client'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { MediaGrid } from '@/components/media/media-grid'
import { Button } from '@/components/ui/button'
import { SkeletonGrid } from '@/components/ui/skeleton'
import { useMedia } from '@/hooks/use-media'
import { useRef, useState } from 'react'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function MediaPage() {
  const { media, loading, error, isUploading, upload, remove } = useMedia()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      upload(e.dataTransfer.files[0])
      e.dataTransfer.clearData()
    }
  }

  return (
    <AuthGuard>
      <ConsoleShell>
        <div 
          className="relative h-full"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-canvas/80 backdrop-blur-sm p-8 transition-all duration-200">
              <div className="w-full h-full border-2 border-dashed border-ink/40 rounded-xl flex items-center justify-center bg-surface-card/50">
                <div className="text-center">
                  <h3 className="font-cal text-[24px] text-ink mb-2">Drop to Upload</h3>
                  <p className="text-muted text-[14px]">Release your file here to upload to your media library</p>
                </div>
              </div>
            </div>
          )}
          <motion.div variants={container} initial="hidden" animate="visible" className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            <motion.div variants={item} className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-cal text-[32px] text-ink leading-none tracking-tighter">Media</h1>
                  {!loading && (
                    <span className="text-[11px] text-muted font-bold tracking-widest uppercase bg-surface-card px-2 py-0.5 rounded">{media.length} ITEMS</span>
                  )}
                </div>
              </div>
              <div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                <Button variant="primary" className="h-9 px-4 text-[13px] font-semibold" onClick={() => inputRef.current?.click()}>
                  Upload Media
                </Button>
              </div>
            </motion.div>
  
            {error && (
              <motion.p variants={item} className="text-error text-[13px] font-medium mb-4">{error}</motion.p>
            )}
  
            {loading ? (
              <motion.div variants={item}>
                <SkeletonGrid count={8} />
              </motion.div>
            ) : (
              <motion.div variants={item}>
                {isUploading && (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                      <div className="aspect-square bg-surface-card border border-hairline relative overflow-hidden flex items-center justify-center group">
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-soft to-canvas animate-pulse" />
                        <span className="relative text-[10px] uppercase tracking-widest font-bold text-muted z-10">Uploading</span>
                      </div>
                    </div>
                  </div>
                )}
                <MediaGrid items={media} onDelete={remove} />
              </motion.div>
            )}
          </motion.div>
        </div>
      </ConsoleShell>
    </AuthGuard>
  )
}
