-- ============================================================================
-- Migration: 002_storage_setup
-- Description: Create media storage bucket with RLS policies and helper functions
-- Note: Requires Supabase Storage to be enabled on the project
-- ============================================================================

-- ============================================================================
-- 1. CREATE BUCKET
-- ============================================================================
-- Uses the storage API. Run this via Supabase dashboard SQL editor or CLI.
-- The bucket is public so Meta Graph API can fetch media at publish time.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  209715200,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. STORAGE RLS POLICIES
-- ============================================================================

-- 2.1 SELECT — authenticated users can read any media file
-- (needed for frontend previews and Meta API fetching at publish time)
CREATE POLICY "media_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

-- 2.2 INSERT — users can only upload to their own folder
-- Folder path: media/{auth.uid()}/*
CREATE POLICY "media_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2.3 UPDATE — users can update files in their own folder
CREATE POLICY "media_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2.4 DELETE — users can delete files in their own folder
CREATE POLICY "media_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 3. HELPER FUNCTION: Generate media public URL
-- ============================================================================
-- Used by n8n workflows to construct the URL for Meta Graph API

CREATE OR REPLACE FUNCTION get_media_public_url(storage_path TEXT)
RETURNS TEXT AS $$
DECLARE
  project_url TEXT;
BEGIN
  project_url := current_setting('app.supabase_url', true);
  IF project_url IS NULL THEN
    RAISE EXCEPTION 'app.supabase_url not set — run: SELECT set_config(''app.supabase_url'', ''https://<project>.supabase.co'', false)';
  END IF;
  RETURN project_url || '/storage/v1/object/public/' || storage_path;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 4. HELPER FUNCTION: Generate signed URL (for n8n service_role usage)
-- ============================================================================
-- n8n calls this via Supabase management API, not direct SQL.
-- Instead, n8n uses the Supabase SDK endpoint:
--   POST /storage/v1/object/sign/{path}
-- with service_role key for authentication.
-- 
-- The signed URL expires in 3600 seconds (1 hour).
-- 
-- Example n8n HTTP Request node config:
--   Method: POST
--   URL: https://{project}.supabase.co/storage/v1/object/sign/media/{path}
--   Headers:
--     Authorization: Bearer {service_role_key}
--     Content-Type: application/json
--   Body: { "expiresIn": 3600 }

-- ============================================================================
-- 5. VERIFICATION QUERY
-- ============================================================================
-- Run after setup to confirm:
-- SELECT id, name, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets
-- WHERE id = 'media';
