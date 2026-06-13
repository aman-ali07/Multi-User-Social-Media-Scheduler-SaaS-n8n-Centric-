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
  const [error, setError] = useState<string | null>(null)

  const validateAndProcess = async (file: File) => {
    setError(null)
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (isVideo && file.size > 100 * 1024 * 1024) {
      setError('Video exceeds 100MB limit.')
      return
    }
    if (isImage && file.size > 8 * 1024 * 1024) {
      setError('Image exceeds 8MB limit.')
      return
    }

    const url = URL.createObjectURL(file)
    const checkRatio = (width: number, height: number) => {
      URL.revokeObjectURL(url)
      const ratio = width / height
      if (ratio < 0.79 || ratio > 1.92) {
        setError(`Invalid aspect ratio (${(ratio).toFixed(2)}). Must be between 4:5 and 1.91:1.`)
      } else {
        onFile(file)
      }
    }

    if (isImage) {
      const img = new Image()
      img.onload = () => checkRatio(img.width, img.height)
      img.onerror = () => { URL.revokeObjectURL(url); setError('Invalid image file') }
      img.src = url
    } else if (isVideo) {
      const video = document.createElement('video')
      video.onloadedmetadata = () => checkRatio(video.videoWidth, video.videoHeight)
      video.onerror = () => { URL.revokeObjectURL(url); setError('Invalid video file') }
      video.src = url
    } else {
      setError('Unsupported file type.')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndProcess(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndProcess(file)
  }

  return (
    <div className="space-y-2">
      <label className="text-[14px] font-medium text-ink tracking-wide">
        Media
      </label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-md p-10 text-center cursor-pointer transition-all',
          dragging
            ? 'border-ink bg-black/5'
            : 'border-hairline hover:border-ink/30 bg-canvas shadow-sm',
          error ? 'border-error/50 bg-error/5' : ''
        )}
      >
        <p className="text-ink font-medium text-[15px]">
          Drop media here or click to browse
        </p>
        <p className="text-muted text-[13px] font-medium mt-2">JPG, PNG, GIF, MP4 (Max 100MB)</p>
        {error && <p className="text-error text-[13px] font-bold mt-3">{error}</p>}
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
