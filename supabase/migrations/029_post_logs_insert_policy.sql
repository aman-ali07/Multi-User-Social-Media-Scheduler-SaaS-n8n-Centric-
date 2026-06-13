-- Fix H23: Add INSERT RLS policy for post_logs
-- post_logs only had a SELECT policy (created in 001, replaced in 009).
-- n8n bypasses RLS via service_role, but authenticated clients using
-- the anon key directly cannot insert. Add a policy that permits
-- inserts where user_id matches the authenticated user.

CREATE POLICY post_logs_insert_own ON post_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
