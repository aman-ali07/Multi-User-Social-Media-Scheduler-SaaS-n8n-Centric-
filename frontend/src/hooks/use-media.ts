import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import { registerMedia } from '@/lib/n8n'
import type { MediaAsset } from '@/types/database'

export function useMedia() {
  const { user } = useAuth()
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('media_assets')
      .select('id, user_id, file_url, file_type, file_size, storage_path, width, height, duration, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setMedia(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const upload = async (file: File) => {
    if (!user) return
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(`${user.id}/${Date.now()}-${file.name}`, file)

    if (uploadError) { setError(uploadError.message); return }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(uploadData.path)

    await registerMedia(user.id, publicUrl, file.type)
    await load()
  }

  return { media, loading, error, reload: load, upload }
}
