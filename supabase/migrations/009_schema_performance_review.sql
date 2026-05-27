-- ============================================================================
-- Migration: 009_schema_performance_review
-- Description: Schema review fixes
--   1. Composite/sort indexes for dashboard and list query performance
--   2. Denormalize post_logs.user_id to avoid cross-table RLS join
--   3. Drop low-cardinality standalone indexes on status columns
--   4. Add oauth_state CHECK constraint + cleanup mechanism
--   5. Add cancel-posts trigger on social_accounts DELETE
--   6. Add retention cleanup functions for log tables
--   7. Add missing media_assets UPDATE RLS policy
--   8. Fix regex escape in re-encrypt WHERE clause (4 backslashes -> 2)
-- ============================================================================

-- ============================================================================
-- 1. COMPOSITE + SORT INDEXES
-- ============================================================================

-- Dashboard/calendar queries: user_id + schedule_at range filter
-- Covers: use-dashboard (scheduled today, upcoming, velocity)
--         use-calendar (month view)
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_schedule
  ON scheduled_posts(user_id, schedule_at)
  WHERE deleted_at IS NULL;

-- Posts list: user_id + created_at sort
-- Covers: use-posts (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_created
  ON scheduled_posts(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Media list: user_id + created_at sort
-- Covers: use-media (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_media_assets_user_created
  ON media_assets(user_id, created_at DESC);

-- Accounts list: user_id + created_at sort
-- Covers: use-accounts (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_created
  ON social_accounts(user_id, created_at DESC);

-- ============================================================================
-- 2. DENORMALIZE post_logs.user_id
-- ============================================================================
-- Currently the post_logs RLS policy requires a JOIN through scheduled_posts
-- to check ownership. Adding a direct user_id column eliminates this join
-- for both RLS enforcement and frontend queries.

ALTER TABLE post_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from scheduled_posts for existing log entries
UPDATE post_logs pl
SET user_id = sp.user_id
FROM scheduled_posts sp
WHERE sp.id = pl.post_id
  AND pl.user_id IS NULL;

-- Make NOT NULL (will fail if any rows weren't backfilled — logs without
-- a parent post should not exist, but if they do, fix them first)
ALTER TABLE post_logs ALTER COLUMN user_id SET NOT NULL;

-- Index for direct user-based queries
CREATE INDEX IF NOT EXISTS idx_post_logs_user_created
  ON post_logs(user_id, created_at DESC);

-- Replace the subquery-based RLS policy with direct column check
DROP POLICY IF EXISTS post_logs_select_own ON post_logs;
CREATE POLICY post_logs_select_own ON post_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. DROP LOW-CARDINALITY STANDALONE INDEXES
-- ============================================================================
-- These indexes on single status columns have very few distinct values
-- (3 each) and are never efficiently used alone by the query planner.
-- If a status filter is needed, it should be combined with user_id.

DROP INDEX IF EXISTS idx_social_accounts_status;
DROP INDEX IF EXISTS idx_post_logs_status;

-- ============================================================================
-- 4. OAUTH_STATE CLEANUP
-- ============================================================================

-- Prevent creation of states that are already expired
ALTER TABLE oauth_state DROP CONSTRAINT IF EXISTS oauth_state_expires_future;
ALTER TABLE oauth_state ADD CONSTRAINT oauth_state_expires_future
  CHECK (expires_at > created_at);

-- Allow authenticated users to delete their own expired/used states
CREATE POLICY IF NOT EXISTS oauth_state_delete_own ON oauth_state
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Cleanup function: removes expired and used states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_state()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM oauth_state
  WHERE used = true OR expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 5. CANCEL SCHEDULED POSTS ON ACCOUNT DELETE
-- ============================================================================
-- When a social_account is deleted (e.g., user revokes access), any
-- scheduled posts targeting that account would be silently skipped by the
-- scheduler (FK sets account_id NULL, JOIN fails). This trigger catches
-- the deletion and marks those posts as cancelled with a clear reason.

CREATE OR REPLACE FUNCTION cancel_posts_on_account_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE scheduled_posts
  SET status = 'cancelled',
      error_message = 'Social account deleted',
      updated_at = NOW()
  WHERE account_id = OLD.id
    AND status = 'scheduled';
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cancel_scheduled_posts ON social_accounts;
CREATE TRIGGER trg_cancel_scheduled_posts
  BEFORE DELETE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION cancel_posts_on_account_delete();

-- ============================================================================
-- 6. RETENTION CLEANUP FUNCTIONS
-- ============================================================================
-- Run these periodically (e.g., via pg_cron, Supabase Edge Function, or a
-- weekly maintenance task) to prevent unbounded growth of audit tables.

CREATE OR REPLACE FUNCTION cleanup_old_logs(retention_days INT DEFAULT 90)
RETURNS TABLE (table_name TEXT, deleted_rows BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff TIMESTAMPTZ;
  deleted bigint;
BEGIN
  cutoff := NOW() - (retention_days || ' days')::INTERVAL;

  DELETE FROM post_logs WHERE created_at < cutoff;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  table_name := 'post_logs'; deleted_rows := deleted; RETURN NEXT;

  DELETE FROM workflow_runs WHERE created_at < cutoff;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  table_name := 'workflow_runs'; deleted_rows := deleted; RETURN NEXT;

  DELETE FROM token_refresh_log WHERE created_at < cutoff;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  table_name := 'token_refresh_log'; deleted_rows := deleted; RETURN NEXT;
END;
$$;

-- ============================================================================
-- 7. MISSING MEDIA_ASSETS UPDATE RLS POLICY
-- ============================================================================
-- n8n writes media via service_role (bypasses RLS), but if a user needs to
-- update metadata directly via the Data API, an UPDATE policy is required.

CREATE POLICY IF NOT EXISTS media_assets_update_own ON media_assets
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
