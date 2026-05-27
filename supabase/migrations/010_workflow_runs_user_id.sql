-- ============================================================================
-- Migration: 010_workflow_runs_user_id
-- Description: Fix workflow_rins visibility for authenticated users.
--   The triggered_by column is nullable (internal workflows like the failure
--   handler insert with NULL), making rows invisible to users via SELECT RLS.
--   Add a denormalized user_id column and fix RLS policies.
-- ============================================================================

-- ============================================================================
-- 1. ADD user_id COLUMN
-- ============================================================================

ALTER TABLE workflow_runs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from the input_payload's userId for rows triggered by
-- internal workflows (triggered_by is NULL but input_payload contains userId).
-- For rows with triggered_by set, use that directly.
UPDATE workflow_runs
SET user_id = COALESCE(
  triggered_by,
  (input_payload->>'userId')::uuid,
  (input_payload->>'user_id')::uuid
)
WHERE user_id IS NULL;

-- ============================================================================
-- 2. FIX RLS POLICIES
-- ============================================================================

-- Replace the SELECT policy to use direct user_id column instead of triggered_by
DROP POLICY IF EXISTS workflow_runs_select_own ON workflow_runs;
CREATE POLICY workflow_runs_select_own ON workflow_runs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Replace the INSERT policy to allow inserts with the authenticated user's ID
DROP POLICY IF EXISTS workflow_runs_insert_own ON workflow_runs;
CREATE POLICY workflow_runs_insert_own ON workflow_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 3. INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_created
  ON workflow_runs(user_id, created_at DESC);

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================
-- Check for any rows that still have NULL user_id (should not exist after backfill):
-- SELECT id, workflow_name, triggered_by, input_payload
-- FROM workflow_runs WHERE user_id IS NULL;

