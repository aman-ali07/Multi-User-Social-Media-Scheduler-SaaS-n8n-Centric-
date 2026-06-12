-- ============================================================================
-- Migration: 006_remove_custom_guc_dependency
-- Description: Remove dependency on custom GUCs (app.supabase_url,
--   app.encryption_key) which require ALTER DATABASE/SYSTEM permissions
--   unavailable on managed Supabase. Replace with app_config table.
--   Drops migration 005's session-level set_config (non-persistent).
-- ============================================================================

-- ============================================================================
-- 1. APP CONFIG TABLE
-- ============================================================================
-- Stores app-level configuration that (on self-hosted Postgres) would use
-- custom GUCs. Managed Supabase doesn't allow custom GUCs, so we use a
-- dedicated table instead.
--
-- SECURITY: RLS restricts direct reads to service_role only. Functions
-- accessing config values use SECURITY DEFINER to bypass RLS while keeping
-- the table inaccessible to anon/authenticated roles directly.
--
-- NOTE: For production with sensitive values (keys, secrets), consider
-- migrating to Supabase Vault (pgsodium-based, column-level encryption).
-- This table is a pragmatic middle ground.

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed config values for this project.
-- supabase_url is public (same as NEXT_PUBLIC_SUPABASE_URL).
-- encryption_key is used by encrypt_token/decrypt_token functions.
-- For stronger security, use Supabase Vault for the encryption key
-- (requires pgsodium extension).
INSERT INTO app_config (key, value, description) VALUES
  (
    'supabase_url',
    'https://your-project-ref.supabase.co',
    'Supabase project URL for storage public URL construction'
  ),
  (
    'encryption_key',
    'saas-enc-key-2026-05-27-a7f3c9e2b1d8',
    'AES encryption key for pgp_sym_encrypt/decrypt of social account tokens'
  )
ON CONFLICT (key) DO NOTHING;

-- RLS: only service_role (n8n, DB functions) can read config directly
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_service_select" ON app_config
  FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "app_config_service_insert" ON app_config
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "app_config_service_update" ON app_config
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "app_config_service_delete" ON app_config
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. REPLACE get_media_public_url — read from app_config, not custom GUC
-- ============================================================================
-- SECURITY DEFINER so it can read app_config even when called by anon role.
-- This is safe: the function only concatenates a public URL string.

CREATE OR REPLACE FUNCTION get_media_public_url(storage_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url TEXT;
BEGIN
  SELECT value INTO project_url FROM app_config WHERE key = 'supabase_url';

  IF project_url IS NULL THEN
    RAISE EXCEPTION 'app_config missing: supabase_url not set';
  END IF;

  RETURN project_url || '/storage/v1/object/public/' || storage_path;
END;
$$;

-- ============================================================================
-- 3. REPLACE encrypt_token / decrypt_token — read key from app_config
-- ============================================================================
-- Already SECURITY DEFINER, so they can read app_config without RLS issues.

CREATE OR REPLACE FUNCTION encrypt_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  enc_key TEXT;
BEGIN
  SELECT value INTO enc_key FROM app_config WHERE key = 'encryption_key';

  IF enc_key IS NULL THEN
    RAISE EXCEPTION 'app_config missing: encryption_key not set';
  END IF;

  RETURN pgp_sym_encrypt(token, enc_key);
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  enc_key TEXT;
BEGIN
  SELECT value INTO enc_key FROM app_config WHERE key = 'encryption_key';

  IF enc_key IS NULL THEN
    RAISE EXCEPTION 'app_config missing: encryption_key not set';
  END IF;

  RETURN pgp_sym_decrypt(encrypted_token::bytea, enc_key);
END;
$$;

-- ============================================================================
-- 4. MAINTAIN GRANTS
-- ============================================================================
-- get_media_public_url needs explicit grants for anon (used by public pages)
-- and authenticated roles. encrypt_token/decrypt_token are backend-only.

GRANT EXECUTE ON FUNCTION get_media_public_url(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_media_public_url(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION encrypt_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_token(TEXT) TO authenticated;

-- ============================================================================
-- 5. APPLICATION NOTE
-- ============================================================================
-- To update config values (e.g., after migrating to a new Supabase project):
--   INSERT INTO app_config (key, value)
--   VALUES ('supabase_url', 'https://new-project.supabase.co')
--   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
-- 
-- To promote encryption_key to Supabase Vault:
--   1. Enable pgsodium extension
--   2. Create a vault secret
--   3. Use pgsodium's encrypt/decrypt instead of pgp_sym_encrypt
--   4. Update encrypt_token/decrypt_token function bodies
