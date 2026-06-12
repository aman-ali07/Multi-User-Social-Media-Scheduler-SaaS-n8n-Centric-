-- ============================================================================
-- Migration: 020_schema_and_rls_fixes
-- Description: Fix RLS security gaps and performance issues
--   1. Re-create post_media_insert_via_post to enforce media_id ownership (IDOR fix)
--   2. Add post_media_update_via_post to allow frontend to update sort_order
--   3. Update token_refresh_log SELECT policy to use denormalized user_id (Performance fix)
--   4. Update token_refresh_log INSERT policy to use (select auth.uid()) (InitPlan optimization)
--   5. Add missing index on token_refresh_log(user_id)
-- ============================================================================

-- ============================================================================
-- 1. FIX post_media INSERT POLICY (IDOR)
-- ============================================================================
-- The old policy only checked if the user owned the post_id, allowing an attacker
-- to attach any media_id to their post.
DROP POLICY IF EXISTS "post_media_insert_via_post" ON post_media;
CREATE POLICY "post_media_insert_via_post" ON post_media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scheduled_posts
      WHERE scheduled_posts.id = post_media.post_id
      AND scheduled_posts.user_id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM media_assets
      WHERE media_assets.id = post_media.media_id
      AND media_assets.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 2. ADD post_media UPDATE POLICY
-- ============================================================================
-- This allows users to update sort_order of their own media on their own posts.
DROP POLICY IF EXISTS "post_media_update_via_post" ON post_media;
CREATE POLICY "post_media_update_via_post" ON post_media
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_posts
      WHERE scheduled_posts.id = post_media.post_id
      AND scheduled_posts.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scheduled_posts
      WHERE scheduled_posts.id = post_media.post_id
      AND scheduled_posts.user_id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM media_assets
      WHERE media_assets.id = post_media.media_id
      AND media_assets.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 3 & 4. UPDATE token_refresh_log POLICIES
-- ============================================================================
-- Migration 014 denormalized user_id onto this table but forgot to update the
-- SELECT policy to use it, maintaining a slow cross-table join.

DROP POLICY IF EXISTS "token_refresh_log_select_own" ON token_refresh_log;
CREATE POLICY "token_refresh_log_select_own" ON token_refresh_log
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "token_refresh_log_insert_own" ON token_refresh_log;
DROP POLICY IF EXISTS "token_refresh_log_insert_policy" ON token_refresh_log;
CREATE POLICY "token_refresh_log_insert_own" ON token_refresh_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- 5. ADD MISSING INDEX
-- ============================================================================
-- Since token_refresh_log now uses user_id for RLS, we must index it.
CREATE INDEX IF NOT EXISTS idx_token_refresh_log_user_id
  ON token_refresh_log(user_id);
