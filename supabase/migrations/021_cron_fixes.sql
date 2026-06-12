-- ============================================================================
-- Migration: 021_cron_fixes
-- Description: Fix silent post drops and zombie processing posts in pg_cron.
-- ============================================================================

-- 1. Update the dispatcher to handle null token expiration
CREATE OR REPLACE FUNCTION dispatch_due_posts() RETURNS void AS $$
DECLARE
  v_post RECORD;
  v_n8n_url TEXT;
  v_n8n_secret TEXT;
  v_payload JSONB;
  v_request_id BIGINT;
  v_media_urls JSONB;
  v_media_types JSONB;
BEGIN
  SELECT value INTO v_n8n_url FROM system_config WHERE key = 'N8N_WEBHOOK_URL';
  SELECT value INTO v_n8n_secret FROM system_config WHERE key = 'INTERNAL_WEBHOOK_SECRET';

  FOR v_post IN (
    SELECT sp.id, sp.user_id, sp.account_id, sp.caption, sp.platforms, sp.schedule_at, sp.timezone, 
           decrypt_token(sa.access_token) AS access_token, sa.page_id, sa.ig_user_id, sa.platform AS account_platform, 
           sa.status AS account_status, 
           COALESCE(json_agg(json_build_object('file_url', ma.file_url, 'file_type', ma.file_type, 'media_id', ma.id) ORDER BY pm.sort_order) FILTER (WHERE ma.id IS NOT NULL), '[]'::json) AS media
    FROM scheduled_posts sp 
    JOIN social_accounts sa ON sa.id = sp.account_id 
    LEFT JOIN post_media pm ON pm.post_id = sp.id 
    LEFT JOIN media_assets ma ON ma.id = pm.media_id 
    WHERE sp.status = 'scheduled' 
      AND sp.schedule_at <= NOW() 
      AND sp.deleted_at IS NULL 
      AND sa.status = 'active' 
      AND (sa.token_expires_at > NOW() OR sa.token_expires_at IS NULL)
    GROUP BY sp.id, sa.id 
    ORDER BY sp.schedule_at ASC
    FOR UPDATE SKIP LOCKED
  ) LOOP
    -- Mark as processing so we don't pick it up again if it takes a while
    UPDATE scheduled_posts SET status = 'processing', updated_at = NOW() WHERE id = v_post.id;

    -- Extract media arrays
    SELECT COALESCE(jsonb_agg(m->>'file_url'), '[]'::jsonb), COALESCE(jsonb_agg(m->>'file_type'), '[]'::jsonb) 
    INTO v_media_urls, v_media_types
    FROM json_array_elements(v_post.media::json) m;

    -- Build payload for facebook
    IF 'facebook' = ANY(v_post.platforms) THEN
      v_payload := jsonb_build_object(
        'postId', v_post.id,
        'userId', v_post.user_id,
        'accessToken', v_post.access_token,
        'pageId', v_post.page_id,
        'caption', COALESCE(v_post.caption, ''),
        'mediaUrls', v_media_urls,
        'mediaTypes', v_media_types
      );
      SELECT net.http_post(
        url := v_n8n_url || '/facebook-publish',
        body := v_payload,
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-token', v_n8n_secret)
      ) INTO v_request_id;
    END IF;

    -- Build payload for instagram
    IF 'instagram' = ANY(v_post.platforms) AND v_post.ig_user_id IS NOT NULL THEN
      v_payload := jsonb_build_object(
        'postId', v_post.id,
        'userId', v_post.user_id,
        'accessToken', v_post.access_token,
        'igUserId', v_post.ig_user_id,
        'caption', COALESCE(v_post.caption, ''),
        'mediaUrls', v_media_urls,
        'mediaTypes', v_media_types
      );
      SELECT net.http_post(
        url := v_n8n_url || '/instagram-publish',
        body := v_payload,
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-token', v_n8n_secret)
      ) INTO v_request_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Cleanup function for zombie processing posts
CREATE OR REPLACE FUNCTION cleanup_stuck_processing_posts() RETURNS void AS $$
BEGIN
  -- Revert stuck processing posts to failed so they trigger the retry flow or can be manually handled.
  -- A post shouldn't be processing for more than 15 minutes.
  UPDATE scheduled_posts
  SET status = 'failed',
      error_message = 'Webhook dispatch timed out or n8n crashed',
      updated_at = NOW()
  WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cleanup cron job to run every 5 minutes
SELECT cron.schedule('cleanup-stuck-posts', '*/5 * * * *', $$SELECT cleanup_stuck_processing_posts()$$);
