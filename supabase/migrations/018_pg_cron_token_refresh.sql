CREATE OR REPLACE FUNCTION dispatch_token_refresh() RETURNS void AS $$
DECLARE
  v_account RECORD;
  v_n8n_url TEXT;
  v_n8n_secret TEXT;
  v_payload JSONB;
  v_request_id BIGINT;
BEGIN
  SELECT value INTO v_n8n_url FROM system_config WHERE key = 'N8N_WEBHOOK_URL';
  SELECT value INTO v_n8n_secret FROM system_config WHERE key = 'INTERNAL_WEBHOOK_SECRET';

  FOR v_account IN (
    SELECT id, user_id, decrypt_token(access_token) AS access_token, page_id
    FROM social_accounts
    WHERE status = 'active'
      AND token_expires_at IS NOT NULL
      AND token_expires_at < NOW() + INTERVAL '24 hours'
      AND token_expires_at > NOW()
    FOR UPDATE SKIP LOCKED
  ) LOOP
    v_payload := jsonb_build_object(
      'id', v_account.id,
      'user_id', v_account.user_id,
      'access_token', v_account.access_token,
      'page_id', v_account.page_id
    );

    SELECT net.http_post(
      url := v_n8n_url || '/token-refresh',
      body := v_payload,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-token', v_n8n_secret)
    ) INTO v_request_id;
    
    PERFORM pg_sleep(0.5); -- M6: rate-limit concurrent Meta API calls
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the token refresh cron job to run every hour
SELECT cron.schedule('dispatch-token-refresh', '0 * * * *', $$SELECT dispatch_token_refresh()$$);
