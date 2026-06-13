-- Fix C3: Drop idx_post_logs_unique_attempt
-- We will rely on n8n passing attempt_number correctly, but for safety 
-- we drop this index if it's causing issues.
DROP INDEX IF EXISTS idx_post_logs_unique_attempt;
