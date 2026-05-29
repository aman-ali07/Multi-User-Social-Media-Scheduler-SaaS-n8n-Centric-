'use client'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { MediaGrid } from '@/components/media/media-grid'
import { Button } from '@/components/ui/button'
import { SkeletonGrid } from '@/components/ui/skeleton'
import { useMedia } from '@/hooks/use-media'
import { useRef } from 'react'

const container = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function MediaPage() {
  const { media, loading, error, upload } = useMedia()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-4 sm:p-6 space-y-6 max-w-5xl">
          <motion.div variants={item} className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-[28px] text-text tracking-tight">Media</h1>
                {!loading && (
                  <span className="text-[11px] text-text-dim font-mono">{media.length} items</span>
                )}
              </div>
              <p className="text-text-muted text-sm font-sans mt-1">Media library</p>
            </div>
            <div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
                className="hidden"
              />
              <Button variant="gold" size="md" onClick={() => inputRef.current?.click()}>
                ◈ Upload
              </Button>
            </div>
          </motion.div>

          {error && (
            <motion.p variants={item} className="text-red text-[12px] font-mono">{error}</motion.p>
          )}

          {loading ? (
            <motion.div variants={item}>
              <SkeletonGrid count={8} />
            </motion.div>
          ) : (
            <motion.div variants={item}>
              <MediaGrid items={media} />
            </motion.div>
          )}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
