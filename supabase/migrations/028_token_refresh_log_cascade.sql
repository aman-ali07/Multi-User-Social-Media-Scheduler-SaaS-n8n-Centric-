-- Fix H34: Add ON DELETE CASCADE to token_refresh_log.user_id FK
-- Every other FK referencing auth.users uses CASCADE. This one
-- was missed in migration 014 and defaults to NO ACTION, which
-- blocks user deletion if any token_refresh_log rows exist.

ALTER TABLE token_refresh_log
  DROP CONSTRAINT IF EXISTS token_refresh_log_user_id_fkey,
  ADD CONSTRAINT token_refresh_log_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
