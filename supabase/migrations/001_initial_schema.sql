-- ============================================================================
-- Migration: 001_initial_schema
-- Description: Initial database schema for n8n Social Media Scheduler SaaS
-- Tables: profiles, oauth_state, social_accounts, media_assets, scheduled_posts,
--         post_media, post_logs, workflow_runs, token_refresh_log
-- Features: RLS, pgcrypto encryption, storage buckets, audit triggers
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. ENUMS
-- ============================================================================
CREATE TYPE platform_enum AS ENUM ('facebook', 'instagram');

CREATE TYPE post_status_enum AS ENUM ('draft', 'scheduled', 'published', 'failed', 'cancelled');

CREATE TYPE account_status_enum AS ENUM ('active', 'expired', 'revoked');

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- 3.1 profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2 oauth_state
CREATE TABLE oauth_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform platform_enum NOT NULL,
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT,
  redirect_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3 social_accounts
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform platform_enum NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT,
  ig_user_id TEXT,
  ig_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status account_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, page_id)
);

-- 3.4 media_assets
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT,
  width INT,
  height INT,
  duration INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.5 scheduled_posts
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
  title TEXT,
  caption TEXT,
  platforms platform_enum[] NOT NULL DEFAULT '{}',
  schedule_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status post_status_enum NOT NULL DEFAULT 'draft',
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 3.6 post_media (junction)
CREATE TABLE post_media (
  post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, media_id)
);

-- 3.7 post_logs
CREATE TABLE post_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'retry')),
  error_message TEXT,
  response_payload JSONB,
  attempt_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.8 workflow_runs
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  input_payload JSONB,
  output_payload JSONB,
  error_message TEXT,
  duration_ms INT,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.9 token_refresh_log
CREATE TABLE token_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  old_expires_at TIMESTAMPTZ,
  new_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- social_accounts
CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_status ON social_accounts(status);
CREATE INDEX idx_social_accounts_token_expires ON social_accounts(token_expires_at)
  WHERE status = 'active';

-- oauth_state
CREATE INDEX idx_oauth_state_user_id ON oauth_state(user_id);
CREATE INDEX idx_oauth_state_expires ON oauth_state(expires_at);
CREATE INDEX idx_oauth_state_state ON oauth_state(state);

-- media_assets
CREATE INDEX idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX idx_media_assets_file_type ON media_assets(file_type);

-- scheduled_posts
CREATE INDEX idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_status_schedule ON scheduled_posts(status, schedule_at)
  WHERE status = 'scheduled' AND deleted_at IS NULL;
CREATE INDEX idx_scheduled_posts_account_id ON scheduled_posts(account_id);
CREATE INDEX idx_scheduled_posts_deleted_at ON scheduled_posts(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- post_media
CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_media_media_id ON post_media(media_id);

-- post_logs
CREATE INDEX idx_post_logs_post_id ON post_logs(post_id);
CREATE INDEX idx_post_logs_created_at ON post_logs(created_at DESC);
CREATE INDEX idx_post_logs_status ON post_logs(status);

-- workflow_runs
CREATE INDEX idx_workflow_runs_name_created ON workflow_runs(workflow_name, created_at DESC);

-- token_refresh_log
CREATE INDEX idx_token_refresh_log_account ON token_refresh_log(account_id);
CREATE INDEX idx_token_refresh_log_created ON token_refresh_log(created_at DESC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

-- 5.1 profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 5.2 oauth_state
ALTER TABLE oauth_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY oauth_state_select_own ON oauth_state
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY oauth_state_insert_own ON oauth_state
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY oauth_state_update_own ON oauth_state
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5.3 social_accounts
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_accounts_select_own ON social_accounts
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY social_accounts_insert_own ON social_accounts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY social_accounts_update_own ON social_accounts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY social_accounts_delete_own ON social_accounts
  FOR DELETE
  USING (user_id = auth.uid());

-- 5.4 media_assets
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_assets_select_own ON media_assets
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY media_assets_insert_own ON media_assets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY media_assets_delete_own ON media_assets
  FOR DELETE
  USING (user_id = auth.uid());

-- 5.5 scheduled_posts
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_posts_select_own ON scheduled_posts
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY scheduled_posts_insert_own ON scheduled_posts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY scheduled_posts_update_own ON scheduled_posts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY scheduled_posts_delete_own ON scheduled_posts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- 5.6 post_media
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_media_select_via_post ON post_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_posts
      WHERE scheduled_posts.id = post_media.post_id
      AND scheduled_posts.user_id = auth.uid()
    )
  );

CREATE POLICY post_media_insert_via_post ON post_media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scheduled_posts
      WHERE scheduled_posts.id = post_media.post_id
      AND scheduled_posts.user_id = auth.uid()
    )
  );

CREATE POLICY post_media_delete_via_post ON post_media
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_posts
      WHERE scheduled_posts.id = post_media.post_id
      AND scheduled_posts.user_id = auth.uid()
    )
  );

-- 5.7 post_logs
ALTER TABLE post_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_logs_select_own ON post_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_posts
      WHERE scheduled_posts.id = post_logs.post_id
      AND scheduled_posts.user_id = auth.uid()
    )
  );

-- 5.8 workflow_runs
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_runs_select_own ON workflow_runs
  FOR SELECT
  USING (triggered_by = auth.uid());

-- 5.9 token_refresh_log
ALTER TABLE token_refresh_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY token_refresh_log_select_own ON token_refresh_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = token_refresh_log.account_id
      AND social_accounts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. TRIGGERS (updated_at)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. STORAGE SETUP
-- ============================================================================

-- Create media bucket (run separately via Supabase dashboard or management API)
-- The following is for documentation / automation scripts:
--
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'media',
--   'media',
--   true,
--   209715200, -- 200MB
--   ARRAY[
--     'image/jpeg',
--     'image/png',
--     'image/gif',
--     'image/webp',
--     'video/mp4',
--     'video/quicktime'
--   ]::text[]
-- );
--
-- Storage RLS policies:
--
-- CREATE POLICY "media_select_public" ON storage.objects
--   FOR SELECT
--   USING (bucket_id = 'media');
--
-- CREATE POLICY "media_insert_own" ON storage.objects
--   FOR INSERT
--   WITH CHECK (
--     bucket_id = 'media'
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- CREATE POLICY "media_update_own" ON storage.objects
--   FOR UPDATE
--   USING (
--     bucket_id = 'media'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- CREATE POLICY "media_delete_own" ON storage.objects
--   FOR DELETE
--   USING (
--     bucket_id = 'media'
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- ============================================================================
-- 8. HELPER FUNCTIONS for n8n backend
-- ============================================================================

-- Encrypt token using app-level encryption key
-- Key is set via env variable: ENCRYPTION_KEY
CREATE OR REPLACE FUNCTION encrypt_token(token TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_encrypt(token, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrypt token
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_token::bytea, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
