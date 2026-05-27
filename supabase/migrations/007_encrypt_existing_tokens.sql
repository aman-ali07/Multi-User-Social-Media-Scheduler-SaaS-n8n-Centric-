-- ============================================================================
-- Migration: 007_encrypt_existing_tokens
-- Description: Encrypt existing plaintext access tokens using encrypt_token().
--   The OAuth Callback workflow now calls encrypt_token() on insert/update,
--   and the Scheduler/Publish workflows call decrypt_token() on read.
--   This migration converts any plaintext tokens already in the database.
-- ============================================================================

-- Encrypt any tokens that are still in plaintext.
-- encrypt_token() on an already-encrypted value would fail (pgp_sym_encrypt
-- on bytea input), so we filter by checking if the value is valid hex/bytea.
-- A plaintext token starts with 'EAA' (Facebook), while encrypted tokens
-- start with '\x' hex prefix.
UPDATE social_accounts
SET access_token = encrypt_token(access_token)
WHERE access_token IS NOT NULL
  AND access_token !~ '^\\\\x';
