-- ============================================================================
-- Migration: 011_revoke_security_definer_anon
-- Description: Revoke EXECUTE on SECURITY DEFINER functions from PUBLIC/anon
--   Migration 008 attempted this but REVOKE from specific roles wasn't
--   sufficient because the default PUBLIC grant was still in effect.
--   This migration revokes from PUBLIC explicitly for all sensitive functions.
-- ============================================================================

-- ============================================================================
-- 1. REVOKE FROM PUBLIC (covers anon + authenticated + all roles)
-- ============================================================================
-- These SECURITY DEFINER functions must only be callable via service_role
-- (used by n8n's Postgres credential). Direct access via anon key bypasses
-- RLS and is a security risk.

REVOKE EXECUTE ON FUNCTION cancel_posts_on_account_delete() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION cleanup_expired_oauth_state() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION cleanup_old_logs(retention_days integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION decrypt_token(TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION encrypt_token(TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_media_public_url(TEXT) FROM anon, authenticated;
DO $$
BEGIN
  REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, authenticated;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'handle_new_user() does not exist — skipping REVOKE';
END $$;

-- ============================================================================
-- 2. KEEP get_global_stats PUBLIC (landing page stats)
-- ============================================================================
-- This function intentionally displays aggregate stats to unauthenticated
-- visitors on the landing page. It only returns aggregated counts, never
-- individual user data.

-- Grants are preserved from migration 003:
--   GRANT EXECUTE ON FUNCTION get_global_stats() TO anon;
--   GRANT EXECUTE ON FUNCTION get_global_stats() TO authenticated;

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================
-- Run after deploy to confirm:
-- SELECT p.proname AS function_name,
--        has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.prosecdef = true
--   AND p.proname NOT IN ('get_global_stats')
-- ORDER BY p.proname;
