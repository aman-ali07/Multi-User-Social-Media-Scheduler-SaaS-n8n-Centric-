-- Fix C2: Add container_id to scheduled_posts
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS container_id text;
