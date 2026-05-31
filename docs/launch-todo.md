# Launch Todo — Low Priority Items

These items were identified during the launch-readiness audit but are **not blocking** launch. Address after going live.

## L1: Add `user_id` column to `post_logs` UNIQUE constraint

- Current: `UNIQUE (post_id, workflow_name, attempt_number)`
- Issue: `user_id` is in the INSERT but not in the constraint — theoretically allows a cross-user duplicate
- Fix: `ALTER TABLE post_logs DROP CONSTRAINT post_logs_unique; ALTER TABLE post_logs ADD CONSTRAINT post_logs_unique UNIQUE (post_id, workflow_name, attempt_number, user_id);`
- Risk: Low. Only affects edge case where two users somehow share a post_id (prevented by RLS)

## L2: Add `page_id` to `08-token-refresh.ts` webhook input (future)

- Current: Workflow looks up `page_id` via DB query
- Enhancement: Accept `pageId` directly in webhook body to skip the DB lookup round-trip
- Requires: Coordinated update with any callers (currently none — cron scheduler does refresh inline)

## L3: Remove `newCredential` usage pattern (cosmetic)

- Current: `newCredential('Supabase DB')` is used as a function call
- Issue: If the SDK expects a constructor (`new Credential(...)`) or a different API, this may fail TypeScript strict mode
- Resolution: Test with `tsc --noEmit` and adjust import/usage

## L4: Fix `02-oauth-callback.ts` redundant `exchangeLongLived` node

- Current: The workflow exchanges short-lived token → long-lived token via `fb_exchange_token` endpoint, but the cron scheduler's `exchangeForLongLivedToken` already does this for new accounts
- Issue: The OAuth callback performs an extra exchange; the cron scheduler also refreshes via page endpoint
- Enhancement: Consolidate token refresh strategy to page-endpoint-only

## L5: Add request timeout to HTTP Request nodes

- Current: No explicit timeouts on HTTP Request nodes (use n8n default)
- Issue: Default timeout may be too long or too short for Meta API
- Fix: Add `options.timeout` to every `httpRequest` node config

## L6: `encrypt_token`/`decrypt_token` naming

- Current: Functions are named `encrypt_token(TEXT)` and `decrypt_token(TEXT)`
- Issue: Inconsistent — uses `TEXT` parameter but actually processes `BYTEA` via `pgp_sym_encrypt`
- Enhancement: Rename to `encrypt_sensitive_text` / `decrypt_sensitive_text` for clarity (requires coordinated migration)

## L7: Add `cleanup_old_logs` cron job

- Current: Function exists but no cron trigger calls it
- Enhancement: Add a scheduled n8n workflow or pg_cron job to periodically purge old `workflow_runs` and `post_logs` records
