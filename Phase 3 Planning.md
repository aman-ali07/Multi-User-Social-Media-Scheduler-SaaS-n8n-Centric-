# Phase 3 — Supabase Storage Implementation Plan

## Overview

Production-ready storage setup for media assets (images + videos) used in social media posts. n8n and frontend interact with storage via Supabase APIs.

---

## Step 1 — Bucket Configuration

### Bucket: `media`
| Property | Value |
|----------|-------|
| Name | `media` |
| Public | `true` |
| File Size Limit | 200MB (209,715,200 bytes) |
| Allowed MIME Types | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `video/mp4`, `video/quicktime` |

### Justification for Public Bucket
- Meta Graph API needs publicly accessible URLs to fetch media for publishing
- Signed URLs expire (max 1hr) which isn't suitable for scheduled posts (may be days away)
- Media URLs are stored in DB and referenced by n8n at publish time
- Only authenticated users can upload/delete via RLS

---

## Step 2 — File Path Convention

```
media/{user_id}/{media_id}/{original_filename}
```

Example:
```
media/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/hello-world.jpg
```

This ensures:
- No filename collisions (UUID prefix)
- User isolation via folder prefix
- RLS enforcement via `storage.foldername(name)[1]`

---

## Step 3 — Storage RLS Policies

| Policy | Operation | Rule |
|--------|-----------|------|
| `media_select_public` | SELECT | Anyone authenticated can read (needed for Meta API + preview) |
| `media_insert_own` | INSERT | Authenticated, folder matches `auth.uid()` |
| `media_update_own` | UPDATE | Folder matches `auth.uid()` |
| `media_delete_own` | DELETE | Authenticated, folder matches `auth.uid()` |

---

## Step 4 — Signed URL Strategy

### When Used
- n8n Publish workflow needs to pass a URL to Meta Graph API
- Meta needs to fetch the media file for container creation

### Strategy
1. **Short-term (draft/recent):** Use the public URL directly
   - `https://{project}.supabase.co/storage/v1/object/public/media/{path}`
2. **For security-sensitive contexts:** Generate signed URLs with 1-hour expiry
   - Only done by n8n (service_role key)
   - Frontend never needs signed URLs (uses public URLs for preview)

### n8n Implementation
```
Supabase Storage → Generate Signed URL → Pass to Meta API
```

---

## Step 5 — Deliverables

| File | Contents |
|------|----------|
| `supabase/migrations/002_storage_setup.sql` | Runnable SQL for bucket + policies |
| `n8n/workflows/03-media-upload.json` | n8n workflow for handling uploads |

### Migration File Structure
```sql
-- 1. Create bucket (via supabase_cli or dashboard)
-- 2. Storage RLS policies
-- 3. Helper function for signed URL generation
```

---

## Step 6 — Integration Points

### Frontend Upload Flow
1. User selects file in Composer
2. Frontend uploads directly to Supabase Storage (authenticated, anon key)
3. On success, calls n8n webhook to create `media_assets` DB record
4. Returns `mediaId` to frontend for post creation

### n8n Publish Flow
1. Fetch `media_assets` record by `mediaId`
2. Construct public URL from `storage_path`
3. Pass URL to Meta Graph API media container endpoint

---

**Ready for implementation.** After approval:
1. Run migration SQL to create bucket + policies
2. Document upload integration for frontend
3. Document signed URL generation for n8n
