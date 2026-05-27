-- ============================================================================
-- Migration: 005_set_app_config
-- Description: Replaced by 006_remove_custom_guc_dependency.sql.
-- This migration existed only to run session-level set_config() which is
-- non-persistent and insufficient on managed Supabase.
-- ============================================================================

-- Intentionally empty — superseded by migration 006.
-- Kept as a placeholder so local mirror matches server migration order.
