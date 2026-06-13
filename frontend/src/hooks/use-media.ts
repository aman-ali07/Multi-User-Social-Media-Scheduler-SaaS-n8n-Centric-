import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import { getMedia } from '@/lib/query'
import type { MediaAsset } from '@/types/database'

export function useMedia() {
  const { user } = useAuth()
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!user) return
    try {
      const data = await getMedia({ signal })
      setMedia(Array.isArray(data.media) ? data.media : [])
      setLoading(false)
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load media')
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const abort = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(abort.signal)
    return () => abort.abort()
  }, [load])

  const [isUploading, setIsUploading] = useState(false)

  const upload = async (file: File) => {
    if (!user) return
    setIsUploading(true)
    setError(null)
    const path = `${user.id}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, file)

    if (uploadError) { setError(uploadError.message); setIsUploading(false); return }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(uploadData.path)

    const { error: insertError } = await supabase
      .from('media_assets')
      .insert({
        user_id: user.id,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        storage_path: path,
      })

    if (insertError) { setError(insertError.message); setIsUploading(false); return }

    await load()
    setIsUploading(false)
  }

  const remove = async (id: string) => {
    if (!user) return
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'delete-media', id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || `Failed to delete (${res.status})`)
      }
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete media')
      throw err
    }
  }

  return { media, loading, error, isUploading, reload: load, upload, remove }
}
