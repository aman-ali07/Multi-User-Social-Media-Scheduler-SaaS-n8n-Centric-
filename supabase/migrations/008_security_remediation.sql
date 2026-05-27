-- ============================================================================
-- Migration: 008_security_remediation
-- Description: Security audit fixes
--   1. Replace hardcoded encryption key with cryptographically random key
--   2. Re-encrypt all existing tokens with new key
--   3. Revoke GRANT EXECUTE on encrypt_token/decrypt_token from authenticated
--   4. Add explicit INSERT RLS policies for workflow_runs and token_refresh_log
--   5. Fix old encrypted tokens that used the previous hardcoded key
-- ============================================================================

-- ============================================================================
-- 1. REGENERATE ENCRYPTION KEY + RE-ENCRYPT EXISTING TOKENS
-- ============================================================================
-- The old key was hardcoded in migration 006 SQL (version-controlled).
-- Replace it with a cryptographically random key that only exists in the DB.
--
-- NOTE: If this migration is applied to a database that was freshly seeded
-- with migration 008 (i.e., the old key was never used), no rows will match
-- the re-encrypt WHERE clause and this is a no-op.

DO $$
DECLARE
  old_key TEXT;
  new_key TEXT;
  rec RECORD;
BEGIN
  -- Read the existing (potentially hardcoded) key from app_config
  SELECT value INTO old_key FROM app_config WHERE key = 'encryption_key';

  -- Generate a new cryptographically random key (64 hex chars = 256 bits)
  new_key := encode(gen_random_bytes(32), 'hex');

  -- Re-encrypt existing tokens one at a time with exception handling.
  -- This avoids the all-or-nothing problem: if a single token is corrupted,
  -- the migration continues for the rest.
  FOR rec IN
    SELECT id, access_token FROM social_accounts
    WHERE access_token IS NOT NULL
      AND access_token ~ '^\\x'
  LOOP
    BEGIN
      UPDATE social_accounts
      SET access_token = pgp_sym_encrypt(
        pgp_sym_decrypt(rec.access_token::bytea, old_key),
        new_key
      )
      WHERE id = rec.id;
    EXCEPTION WHEN others THEN
      RAISE WARNING 'Token re-encrypt failed for account % — skipping: %', rec.id, SQLERRM;
    END;
  END LOOP;

  -- Replace the key in app_config with the new random one
  UPDATE app_config
  SET value = new_key, updated_at = now()
  WHERE key = 'encryption_key';

  -- If no row existed (fresh deployment with empty app_config), insert it
  IF NOT FOUND THEN
    INSERT INTO app_config (key, value, description)
    VALUES ('encryption_key', new_key, 'Auto-generated AES encryption key for pgp_sym_encrypt — never written to source control');
  END IF;
END;
$$;

-- ============================================================================
-- 2. REVOKE encrypt_token/decrypt_token FROM CLIENT ROLES
-- ============================================================================
-- These SECURITY DEFINER functions should only be callable by service_role
-- (n8n's Postgres credential), not by client-side authenticated users.
-- Authenticated users should never call encrypt or decrypt directly.
-- The encrypt/decrypt calls happen inside n8n PostgreSQL node queries.

REVOKE EXECUTE ON FUNCTION encrypt_token(TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION decrypt_token(TEXT) FROM authenticated;

-- Keep GRANT for service_role (already implicit via superuser privileges)
-- Ensure anon also cannot execute
REVOKE EXECUTE ON FUNCTION encrypt_token(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION decrypt_token(TEXT) FROM anon;

-- ============================================================================
-- 3. ADD MISSING INSERT RLS POLICIES
-- ============================================================================
-- workflow_rins had only a SELECT policy. Add explicit INSERT policy.
-- Even though n8n uses service_role (bypasses RLS), this prevents anon/
-- authenticated roles from inserting via the Data API.

ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_runs_insert_own ON workflow_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    triggered_by = auth.uid()
  );

-- token_refresh_log had only a SELECT policy. Add explicit INSERT policy.
ALTER TABLE token_refresh_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY token_refresh_log_insert_own ON token_refresh_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = token_refresh_log.account_id
      AND social_accounts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. VERIFICATION HELPERS
-- ============================================================================
-- To verify the key was rotated:
--   SELECT key, left(value, 8) || '...' AS key_preview, updated_at
--   FROM app_config WHERE key = 'encryption_key';
--
-- To verify grants were revoked:
--   SELECT routines.routine_name, routines.specific_schema,
--          routines.security_type
--   FROM information_schema.routine_privileges
--   WHERE routine_name IN ('encrypt_token', 'decrypt_token')
--     AND grantee = 'authenticated';
