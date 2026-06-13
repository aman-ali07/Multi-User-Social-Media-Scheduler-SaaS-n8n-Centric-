-- Fix C1: Add 'processing' to post_status_enum
ALTER TYPE post_status_enum ADD VALUE IF NOT EXISTS 'processing';
