-- ============================================================================
-- Migration: 014_missing_schema_and_rls_fixes
-- Description: Add missing columns, enum values, constraints, and RLS policies
--   1. Add 'refresh_failed' to account_status_enum
--   2. Add error_message column to social_accounts
--   3. Add user_id to token_refresh_log
--   4. Add UNIQUE constraint to post_logs to prevent duplicate retry records
--   5. Add INSERT RLS policy for token_refresh_log (user_id-based)
--   6. Add missing INDEX on token_refresh_log(account_id, status)
-- ============================================================================

-- ============================================================================
-- 1. ADD 'refresh_failed' TO account_status_enum
-- ============================================================================
-- The token refresh workflow sets status to 'refresh_failed' when a token
-- refresh fails after exhausting retries. The original enum only had
-- 'active', 'expired', and 'revoked'.

ALTER TYPE account_status_enum ADD VALUE IF NOT EXISTS 'refresh_failed' AFTER 'active';

-- ============================================================================
-- 2. ADD error_message COLUMN TO social_accounts
-- ============================================================================
-- The token refresh and failure handler workflows need to store the last
-- error message on the account for debugging and user-facing error display.

ALTER TABLE social_accounts
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- ============================================================================
-- 3. ADD user_id TO token_refresh_log
-- ============================================================================
-- The token_refresh_log previously had no direct user_id column, making RLS
-- enforcement via social_accounts join less performant. Add it directly.

ALTER TABLE token_refresh_log
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Backfill user_id for existing rows
UPDATE token_refresh_log
  SET user_id = social_accounts.user_id
  FROM social_accounts
  WHERE token_refresh_log.account_id = social_accounts.id
    AND token_refresh_log.user_id IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE token_refresh_log
  ALTER COLUMN user_id SET NOT NULL;

COMMENT ON COLUMN token_refresh_log.user_id IS 'Denormalized user_id for efficient RLS enforcement';

-- ============================================================================
-- 4. ADD UNIQUE CONSTRAINT ON post_logs
-- ============================================================================
-- Prevent duplicate log entries from retry handler race conditions.
-- Each (post_id, workflow_name, attempt_number) combination should be unique.

DROP INDEX IF EXISTS idx_post_logs_unique_attempt;
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_logs_unique_attempt
  ON post_logs(post_id, workflow_name, attempt_number);

-- ============================================================================
-- 5. ADD INSERT RLS POLICY FOR token_refresh_log
-- ============================================================================

-- Drop any existing catch-all policy first
DROP POLICY IF EXISTS token_refresh_log_insert_own ON token_refresh_log;
DROP POLICY IF EXISTS token_refresh_log_insert_policy ON token_refresh_log;

CREATE POLICY token_refresh_log_insert_policy ON token_refresh_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Ensure RLS is enabled (idempotent)
ALTER TABLE token_refresh_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. ADD INDEXES FOR QUERY PERFORMANCE
-- ============================================================================

-- Token refresh lookups: find latest refresh attempt for an account
CREATE INDEX IF NOT EXISTS idx_token_refresh_log_account_status
  ON token_refresh_log(account_id, status);

-- Social accounts: find accounts with expiring tokens for cron
CREATE INDEX IF NOT EXISTS idx_social_accounts_token_expiry
  ON social_accounts(token_expires_at)
  WHERE status = 'active';
