-- ============================================================================
-- Migration: 015_add_published_meta_id
-- Description: Add published_meta_id column to scheduled_posts
--   The Facebook publish workflow (06-facebook-publish) performs an idempotency
--   check by querying and updating this column. The column was referenced in
--   the workflow but never added to the schema, causing every Facebook publish
--   to fail at the "Check Already Published" step.
-- ============================================================================

ALTER TABLE scheduled_posts
  ADD COLUMN IF NOT EXISTS published_meta_id TEXT;

COMMENT ON COLUMN scheduled_posts.published_meta_id IS
  'The Meta (Facebook/Instagram) post ID returned by the Graph API after successful publish. Used for idempotency — if non-null, the post has already been published and the workflow skips re-publishing.';

-- Index for fast lookup by meta ID (useful for deduplication queries)
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_published_meta_id
  ON scheduled_posts(published_meta_id)
  WHERE published_meta_id IS NOT NULL;
