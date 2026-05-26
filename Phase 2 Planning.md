# Phase 2 — Database & Storage Implementation Plan

## Overview

Generate production-ready Supabase PostgreSQL schema and Storage setup.

## Deliverables

One migration file: `supabase/migrations/001_initial_schema.sql`

---

## Step 1 — Database Schema Design

### Enums to Create
| Enum | Values | Purpose |
|------|--------|---------|
| `platform_enum` | `'facebook', 'instagram'` | Target platforms for posts |
| `post_status_enum` | `'draft', 'scheduled', 'published', 'failed', 'cancelled'` | Lifecycle of a post |
| `account_status_enum` | `'active', 'expired', 'revoked'` | Social account token health |

### Tables to Create (in dependency order)

#### 1. `profiles`
- Extends `auth.users`
- id UUID (PK, references auth.users)
- display_name TEXT
- timezone TEXT (default 'UTC')
- created_at / updated_at

#### 2. `oauth_state`
- id UUID PK
- user_id UUID (FK → auth.users, NOT NULL)
- platform platform_enum
- state TEXT (cryptographically random, UNIQUE)
- code_verifier TEXT (for PKCE)
- redirect_url TEXT
- expires_at TIMESTAMPTZ (TTL 10min)
- used BOOLEAN (default false, prevent replay)
- created_at

#### 3. `social_accounts`
- id UUID PK
- user_id UUID (FK → auth.users, NOT NULL)
- platform platform_enum
- page_id TEXT (Facebook Page ID, NOT NULL)
- page_name TEXT
- ig_user_id TEXT (nullable, Instagram Business Account ID)
- ig_username TEXT (nullable)
- access_token TEXT (encrypted via pgp_sym_encrypt)
- refresh_token TEXT (encrypted, nullable)
- token_expires_at TIMESTAMPTZ
- status account_status_enum (default 'active')
- created_at / updated_at

- UNIQUE constraint on (user_id, platform, page_id)
- Index on (user_id)

#### 4. `media_assets`
- id UUID PK
- user_id UUID (FK → auth.users, NOT NULL)
- file_url TEXT (NOT NULL, the Supabase Storage URL)
- file_type TEXT (MIME type, NOT NULL)
- file_size BIGINT (bytes)
- storage_path TEXT (full path in the bucket)
- width INT (nullable, for images)
- height INT (nullable)
- duration INT (nullable, for videos)
- created_at

- Index on (user_id)

#### 5. `scheduled_posts`
- id UUID PK
- user_id UUID (FK → auth.users, NOT NULL)
- account_id UUID (FK → social_accounts, nullable — for targeting specific account)
- title TEXT
- caption TEXT
- media_ids UUID[] (denormalized array for simpler queries + post_media table for proper relation)
- platforms platform_enum[] (array of target platforms)
- schedule_at TIMESTAMPTZ (nullable — null means draft)
- published_at TIMESTAMPTZ (nullable)
- timezone TEXT (default 'UTC')
- status post_status_enum (default 'draft')
- retry_count INT (default 0)
- max_retries INT (default 3)
- error_message TEXT (nullable)
- created_at / updated_at
- deleted_at TIMESTAMPTZ (soft delete)

- Index on (status, schedule_at) — critical for scheduler query performance
- Index on (user_id)
- Index on (account_id)

#### 6. `post_media` (junction)
- post_id UUID (FK → scheduled_posts, CASCADE)
- media_id UUID (FK → media_assets, CASCADE)
- sort_order INT (preserve ordering)

- PK: (post_id, media_id)

#### 7. `post_logs`
- id UUID PK
- post_id UUID (FK → scheduled_posts, CASCADE)
- workflow_name TEXT
- status TEXT ('success', 'error', 'retry')
- error_message TEXT (nullable)
- response_payload JSONB (nullable — store Meta API raw response)
- attempt_number INT (default 1)
- created_at

- Index on (post_id)
- Index on (created_at DESC)

#### 8. `workflow_runs`
- id UUID PK
- workflow_name TEXT (NOT NULL)
- status TEXT ('running', 'success', 'error')
- input_payload JSONB
- output_payload JSONB
- error_message TEXT
- duration_ms INT
- triggered_by UUID (nullable — FK to user who initiated)
- created_at

- Index on (workflow_name, created_at DESC)

#### 9. `token_refresh_log`
- id UUID PK
- account_id UUID (FK → social_accounts, CASCADE)
- old_expires_at TIMESTAMPTZ
- new_expires_at TIMESTAMPTZ (nullable if failed)
- status TEXT ('success', 'failed')
- error_message TEXT
- created_at

---

## Step 2 — RLS Policies

### Philosophy
- `auth.users` is managed by Supabase Auth (no direct RLS needed)
- All user-owned tables use `auth.uid()` for row-level filtering
- n8n uses service_role key (bypasses RLS completely for backend operations)
- Frontend uses anon key with proper RLS

### Policy per Table

| Table | Operation | Policy |
|-------|-----------|--------|
| profiles | SELECT | Own profile only (auth.uid() = id) |
| profiles | INSERT | Own profile only |
| profiles | UPDATE | Own profile only |
| oauth_state | SELECT | Own state only |
| oauth_state | INSERT | Own state only |
| oauth_state | UPDATE | Own state only |
| social_accounts | SELECT | Own accounts only |
| social_accounts | INSERT | Own accounts only |
| social_accounts | UPDATE | Own accounts only |
| social_accounts | DELETE | Own accounts only |
| media_assets | SELECT | Own media only |
| media_assets | INSERT | Own media only |
| media_assets | DELETE | Own media only |
| scheduled_posts | SELECT | Own posts only |
| scheduled_posts | INSERT | Own posts only |
| scheduled_posts | UPDATE | Own posts only |
| scheduled_posts | DELETE | Own posts only (soft delete = UPDATE) |
| post_media | SELECT | Via post ownership |
| post_media | INSERT | Via post ownership |
| post_media | DELETE | Via post ownership |
| post_logs | SELECT | Own posts' logs only |
| workflow_runs | SELECT | Own runs only |
| token_refresh_log | SELECT | Own accounts' logs only |

---

## Step 3 — Storage Setup

### Bucket: `media`
- Public bucket for file storage
- Folder structure: `{user_id}/{media_id}/{filename}`
- File size limit: 25MB
- Allowed MIME types:
  - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  - Video: `video/mp4`, `video/quicktime`

### Storage Policies
| Policy | Type | Rule |
|--------|------|------|
| SELECT | Public | Authenticated users can read any file (needed for preview) |
| INSERT | Authenticated | Users can upload to their own folder only (WHERE bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text) |
| UPDATE | Authenticated | Users can update their own files |
| DELETE | Authenticated | Users can delete their own files |

### Signed URL Strategy
- n8n generates signed URLs for media retrieval when publishing
- Signed URLs expire after 1 hour
- Used only in n8n backend workflows (Meta API needs a public or signed URL)

---

## Step 4 — SQL Migration Structure

The file will be structured as:

```sql
-- 001_initial_schema.sql
-- ====== 1. ENUMS ======
-- ====== 2. EXTENSIONS (pgcrypto) ======
-- ====== 3. TABLES in dependency order ======
-- ====== 4. INDEXES ======
-- ====== 5. ROW LEVEL SECURITY ======
-- ====== 6. STORAGE ======
-- ====== 7. TRIGGERS (updated_at) ======
```

---

## Execution Order

```mermaid
1. Drop existing if re-run (idempotent safety)
    → 2. Create enums
    → 3. Enable extensions (pgcrypto, uuid-ossp)
    → 4. Create tables in dependency order
    → 5. Create indexes
    → 6. Enable RLS on all tables
    → 7. Create RLS policies
    → 8. Create updated_at trigger function + triggers
    → 9. Set up storage bucket + policies
```

---

**Ready for implementation.** After approval, I will:
1. Create `supabase/migrations/001_initial_schema.sql` with full SQL
2. First generate the file, then you can review before executing against Supabase
