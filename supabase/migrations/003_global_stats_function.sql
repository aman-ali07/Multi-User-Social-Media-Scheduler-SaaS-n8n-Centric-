-- ============================================================================
-- Migration: 003_global_stats_function
-- Description: Public stats for the landing page — aggregates across all users.
-- SECURITY DEFINER + intentional anon access for public landing page display.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'postsPublished', (SELECT COUNT(*) FROM scheduled_posts WHERE status = 'published'),
    'accountsConnected', (SELECT COUNT(*) FROM social_accounts WHERE status = 'active'),
    'avgUptime', (
      SELECT COALESCE(
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'success')::decimal / NULLIF(COUNT(*), 0)) * 100,
          1
        ),
        0
      )
      FROM post_logs
    ),
    'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM scheduled_posts)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_global_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_global_stats() TO authenticated;
