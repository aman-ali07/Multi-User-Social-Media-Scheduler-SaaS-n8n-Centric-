-- ============================================================================
-- Migration: 019_secure_system_config
-- Description: Enable RLS on system_config table to prevent public API access
-- ============================================================================

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Note: We intentionally do NOT create any policies.
-- This ensures that 0 rows are visible or modifiable via the API,
-- but the table remains accessible to postgres superusers or functions running 
-- with SECURITY DEFINER (like dispatch_due_posts).
