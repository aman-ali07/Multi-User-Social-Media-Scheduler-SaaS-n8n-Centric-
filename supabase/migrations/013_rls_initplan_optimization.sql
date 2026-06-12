-- ============================================================================
-- Migration: 013_rls_initplan_optimization
-- Description: Wrap auth.uid() in subquery to enable InitPlan optimization
--   When auth.uid() appears directly in RLS policy expressions, Postgres
--   evaluates it once per row. Wrapping in (SELECT auth.uid()) lets the
--   planner compute it once per query (InitPlan) and reuse the result,
--   significantly reducing overhead on multi-row operations.
-- ============================================================================

-- ============================================================================
-- 1. media_assets
-- ============================================================================
DROP POLICY IF EXISTS "media_assets_select_own" ON media_assets;
CREATE POLICY "media_assets_select_own" ON media_assets
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "media_assets_insert_own" ON media_assets;
CREATE POLICY "media_assets_insert_own" ON media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "media_assets_update_own" ON media_assets;
CREATE POLICY "media_assets_update_own" ON media_assets
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "media_assets_delete_own" ON media_assets;
CREATE POLICY "media_assets_delete_own" ON media_assets
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 2. oauth_state
-- ============================================================================
DROP POLICY IF EXISTS "oauth_state_select_own" ON oauth_state;
CREATE POLICY "oauth_state_select_own" ON oauth_state
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "oauth_state_insert_own" ON oauth_state;
CREATE POLICY "oauth_state_insert_own" ON oauth_state
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "oauth_state_update_own" ON oauth_state;
CREATE POLICY "oauth_state_update_own" ON oauth_state
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "oauth_state_delete_own" ON oauth_state;
CREATE POLICY "oauth_state_delete_own" ON oauth_state
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 3. post_logs
-- ============================================================================
DROP POLICY IF EXISTS "post_logs_select_own" ON post_logs;
CREATE POLICY "post_logs_select_own" ON post_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 4. post_media (subquery with scheduled_posts join)
-- ============================================================================
DROP POLICY IF EXISTS "post_media_select_via_post" ON post_media;
CREATE POLICY "post_media_select_via_post" ON post_media
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM scheduled_posts
    WHERE scheduled_posts.id = post_media.post_id
    AND scheduled_posts.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "post_media_insert_via_post" ON post_media;
CREATE POLICY "post_media_insert_via_post" ON post_media
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM scheduled_posts
    WHERE scheduled_posts.id = post_media.post_id
    AND scheduled_posts.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "post_media_delete_via_post" ON post_media;
CREATE POLICY "post_media_delete_via_post" ON post_media
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM scheduled_posts
    WHERE scheduled_posts.id = post_media.post_id
    AND scheduled_posts.user_id = (select auth.uid())
  ));

-- ============================================================================
-- 5. profiles
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================================================
-- 6. scheduled_posts
-- ============================================================================
DROP POLICY IF EXISTS "scheduled_posts_select_own" ON scheduled_posts;
CREATE POLICY "scheduled_posts_select_own" ON scheduled_posts
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "scheduled_posts_insert_own" ON scheduled_posts;
CREATE POLICY "scheduled_posts_insert_own" ON scheduled_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "scheduled_posts_update_own" ON scheduled_posts;
CREATE POLICY "scheduled_posts_update_own" ON scheduled_posts
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "scheduled_posts_delete_own" ON scheduled_posts;
CREATE POLICY "scheduled_posts_delete_own" ON scheduled_posts
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()) AND deleted_at IS NOT NULL);

-- ============================================================================
-- 7. social_accounts
-- ============================================================================
DROP POLICY IF EXISTS "social_accounts_select_own" ON social_accounts;
CREATE POLICY "social_accounts_select_own" ON social_accounts
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "social_accounts_insert_own" ON social_accounts;
CREATE POLICY "social_accounts_insert_own" ON social_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "social_accounts_update_own" ON social_accounts;
CREATE POLICY "social_accounts_update_own" ON social_accounts
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "social_accounts_delete_own" ON social_accounts;
CREATE POLICY "social_accounts_delete_own" ON social_accounts
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 8. token_refresh_log (subquery with social_accounts join)
-- ============================================================================
DROP POLICY IF EXISTS "token_refresh_log_select_own" ON token_refresh_log;
CREATE POLICY "token_refresh_log_select_own" ON token_refresh_log
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM social_accounts
    WHERE social_accounts.id = token_refresh_log.account_id
    AND social_accounts.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "token_refresh_log_insert_own" ON token_refresh_log;
CREATE POLICY "token_refresh_log_insert_own" ON token_refresh_log
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM social_accounts
    WHERE social_accounts.id = token_refresh_log.account_id
    AND social_accounts.user_id = (select auth.uid())
  ));

-- ============================================================================
-- 9. workflow_runs
-- ============================================================================
DROP POLICY IF EXISTS "workflow_runs_select_own" ON workflow_runs;
CREATE POLICY "workflow_runs_select_own" ON workflow_runs
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "workflow_runs_insert_own" ON workflow_runs;
CREATE POLICY "workflow_runs_insert_own" ON workflow_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- 10. storage.objects (auth.uid() in folder path)
-- ============================================================================
DROP POLICY IF EXISTS "media_delete_own" ON storage.objects;
CREATE POLICY "media_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

DROP POLICY IF EXISTS "media_insert_own" ON storage.objects;
CREATE POLICY "media_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

DROP POLICY IF EXISTS "media_update_own" ON storage.objects;
CREATE POLICY "media_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ============================================================================
-- 11. VERIFICATION
-- ============================================================================
-- Run after deploy to confirm:
-- SELECT schemaname, tablename, policyname, qual
-- FROM pg_policies
-- WHERE qual LIKE '%(select auth.uid())%'
--    OR with_check LIKE '%(select auth.uid())%'
-- ORDER BY schemaname, tablename, policyname;
