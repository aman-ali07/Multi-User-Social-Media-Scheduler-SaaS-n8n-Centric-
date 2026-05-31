-- ============================================================================
-- Migration: 012_storage_select_own_only
-- Description: Restrict storage.objects SELECT policy to own files
--   The existing "media_select_public" policy allowed anyone (including
--   unauthenticated users) to list/download files via the storage API.
--   Direct URL access is unaffected because the bucket is public.
--   This change prevents anonymous file listing while preserving authenticated
--   access to own files.
-- ============================================================================

-- ============================================================================
-- 1. DROP THE PUBLIC SELECT POLICY
-- ============================================================================
DROP POLICY IF EXISTS "media_select_public" ON storage.objects;

-- ============================================================================
-- 2. CREATE RESTRICTED SELECT POLICY
-- ============================================================================
CREATE POLICY "media_select_own" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================
-- Run after deploy to confirm:
-- SELECT schemaname, tablename, policyname, roles, qual
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects';
