-- Add helper function for Next.js to upsert social accounts and encrypt token securely
CREATE OR REPLACE FUNCTION upsert_social_account(
  p_user_id UUID,
  p_platform platform_enum,
  p_page_id TEXT,
  p_page_name TEXT,
  p_ig_user_id TEXT,
  p_access_token TEXT,
  p_expires_at TIMESTAMPTZ,
  p_status account_status_enum
) RETURNS void AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: p_user_id does not match authenticated user';
  END IF;

  INSERT INTO social_accounts (user_id, platform, page_id, page_name, ig_user_id, access_token, token_expires_at, status)
  VALUES (p_user_id, p_platform, p_page_id, p_page_name, p_ig_user_id, encrypt_token(p_access_token), p_expires_at, p_status)
  ON CONFLICT (user_id, platform, page_id)
  DO UPDATE SET
    access_token = EXCLUDED.access_token,
    page_name = EXCLUDED.page_name,
    ig_user_id = EXCLUDED.ig_user_id,
    token_expires_at = EXCLUDED.token_expires_at,
    status = EXCLUDED.status,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION upsert_social_account TO authenticated;
