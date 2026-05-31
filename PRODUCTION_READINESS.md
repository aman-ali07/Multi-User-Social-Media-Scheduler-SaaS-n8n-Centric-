# Production Readiness Plan

> **Project:** Console — Social Media Scheduler
> **Frontend:** https://multi-user-social-media-scheduler-s.vercel.app
> **n8n:** https://aman01.app.n8n.cloud
> **Supabase:** dzbkiqtzyofzcfqgundy.supabase.co
> **Status:** 🟡 In Progress

---

## Quick Status

| Phase | Progress | Tasks |
|---|---|---|
| P1: Infra & Config | ▰▰▰▰▰▰▰▰▰▰ 45% | 5/11 |
| P2: Core Integration | ▰▰▰▰▰▰▰▰▰▰ 0% | 0/4 |
| P3: Scheduling | ▰▰▰▰▰▰▰▰▰▰ 0% | 0/4 |
| P4: Polish & Security | ▰▰▰▰▰▰▰▰▰▰ 0% | 0/4 |
| P5: E2E Verification | ▰▰▰▰▰▰▰▰▰▰ 0% | 0/2 |

---

## Phase 1: Infrastructure & Configuration

### 1.1 Deploy n8n workflows to cloud instance

> **Status:** ✅ Already deployed. 9 of 10 active, 1 inactive.

| # | Workflow | Status | Notes |
|---|----------|--------|-------|
| 01 | OAuth Connect | ✅ Active | Draft has newer code (PKCE, frontend redirect) — needs publishing |
| 02 | OAuth Callback | ✅ Active | Draft has newer code (frontend redirect) — needs publishing |
| 03 | Media Upload | ✅ Active | Handles media asset insert |
| 04 | Post CRUD | ✅ Active | Create/edit/cancel posts |
| 05 | Cron Scheduler | ⏸️ Inactive | **Needs activation** |
| 06 | Facebook Publish | ✅ Active | |
| 07 | Instagram Publish | ✅ Active | |
| 08 | Token Refresh | ✅ Active | |
| 09 | Retry Handler | ✅ Active | |
| 10 | Failure Handler | ✅ Active | |
| 11 | Logging | ✅ Active | |

**File:** `n8n/workflows/*.ts`
**SDK:** `@n8n/workflow-sdk` (root `package.json`)

### 1.2 Set n8n environment variables

- [ ] Set `FACEBOOK_APP_ID` in n8n cloud env
- [ ] Set `FACEBOOK_APP_SECRET` in n8n cloud env
- [ ] Generate and set `INTERNAL_WEBHOOK_SECRET` (`openssl rand -hex 32`)
- [ ] Verify `SUPABASE_AUTH_URL` is set (should be `https://dzbkiqtzyofzcfqgundy.supabase.co/auth/v1/user`)
- [ ] Set `FRONTEND_URL` in n8n cloud env

### 1.3 Set frontend environment variables

- [ ] Add `FRONTEND_URL` to Vercel project
- [ ] Add `NEXT_PUBLIC_FRONTEND_URL` to Vercel project
- [ ] Verify `NEXT_PUBLIC_N8N_WEBHOOK_URL` points to `https://aman01.app.n8n.cloud/`
- [ ] Re-deploy frontend after env changes

**File:** `frontend/.env.local` (local) → Vercel dashboard (production)

### 1.4 Create Meta App

- [ ] Go to https://developers.facebook.com/ → Create App → Business
- [ ] Add Facebook Login product
- [ ] Configure OAuth redirect URI: `https://multi-user-social-media-scheduler-s.vercel.app/accounts/connect`
- [ ] Add Instagram Basic Display product
- [ ] Add Pages API product
- [ ] Get `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`
- [ ] Submit for review: `pages_manage_posts`, `pages_read_engagement`
- [ ] Submit for review: `instagram_basic`, `instagram_content_publish`
- [ ] Set App to Live mode (not Development)

### 1.5 Verify Supabase Storage bucket

- [ ] Confirm `media` bucket exists in Supabase Storage dashboard
- [ ] Verify RLS policies from `002_storage_setup.sql` are active
- [ ] Test public URL generation

---

## Phase 2: Core Feature Integration

### 2.1 Enable OAuth Connect flow

- [ ] Verify `01-oauth-connect.ts` workflow deployed
- [ ] Verify `02-oauth-callback.ts` workflow deployed
- [ ] Test "Connect Facebook" button click
- [ ] Verify redirect to Meta OAuth dialog
- [ ] Test OAuth callback redirect to `/accounts?success=connected`
- [ ] Verify `social_accounts` row created
- [ ] Verify token encrypted in DB

**Files involved:**
- `frontend/src/app/accounts/page.tsx` — ConnectButton
- `frontend/src/app/accounts/connect/route.ts` — OAuth callback
- `frontend/src/hooks/use-accounts.ts` — `connect()` calls n8n
- `frontend/src/lib/n8n.ts` — `connectOAuth()` API
- `n8n/workflows/01-oauth-connect.ts` — generates OAuth URL
- `n8n/workflows/02-oauth-callback.ts` — exchanges code

### 2.2 Enable Meta OAuth signup/login (if desired)

- [ ] Decide if "Meta Business Account" button on auth pages is needed
- [ ] If yes: wire up `supabase.auth.signInWithOAuth({ provider: 'facebook' })`
- [ ] If no: remove the disabled button from UI

**Files:** `frontend/src/app/auth/login/page.tsx`, `frontend/src/app/auth/register/page.tsx`

### 2.3 Test media upload

- [ ] Upload test image from `/media` page
- [ ] Verify stored in Supabase Storage `media/` bucket
- [ ] Verify `media_assets` row created
- [ ] Verify composer media dropzone attaches files
- [ ] Test image preview in composer

**Files:**
- `frontend/src/app/media/page.tsx`
- `frontend/src/hooks/use-media.ts` — upload to `supabase.storage.from('media')`
- `frontend/src/components/media/media-grid.tsx`

### 2.4 Test post creation

- [ ] Create a draft post from composer
- [ ] Verify `POST /api/n8n/post` call to `04-post-crud.ts`
- [ ] Verify `scheduled_posts` row created
- [ ] Test editing post via `/composer/[id]`
- [ ] Test cancel post from detail page
- [ ] Verify status transitions (draft → scheduled → cancelled)

**Files:**
- `frontend/src/app/composer/page.tsx`
- `frontend/src/app/composer/[id]/page.tsx`
- `frontend/src/lib/n8n.ts` — `createPost()`, `updatePost()`, `cancelPost()`
- `n8n/workflows/04-post-crud.ts`

---

## Phase 3: Scheduling & Publishing

### 3.1 Test cron scheduler

- [ ] Verify `05-cron-scheduler.ts` deployed
- [ ] Create a post scheduled 5 min in future
- [ ] Wait for cron to pick it up
- [ ] Verify post dispatched to publish workflow
- [ ] Check `scheduled_posts.status` transitions to `published`

**File:** `n8n/workflows/05-cron-scheduler.ts`

### 3.2 Test Facebook publishing

- [ ] Verify `06-facebook-publish.ts` deployed
- [ ] Test publishing to Facebook Page via Graph API
- [ ] Test with text-only post
- [ ] Test with image attachment
- [ ] Verify post appears on actual Facebook Page

**File:** `n8n/workflows/06-facebook-publish.ts`

### 3.3 Test Instagram publishing

- [ ] Verify `07-instagram-publish.ts` deployed
- [ ] Test creating IG Media Container
- [ ] Test publishing container
- [ ] Verify post appears on Instagram

**File:** `n8n/workflows/07-instagram-publish.ts`

### 3.4 Test retry & failure handling

- [ ] Verify `09-retry-handler.ts` deployed
- [ ] Verify `10-failure-handler.ts` deployed
- [ ] Trigger a publish failure (invalid token, etc.)
- [ ] Verify `retry_count` increments
- [ ] Verify max retries (3) exhausted → status = `failed`
- [ ] Check `post_logs` entries for each attempt

**Files:**
- `n8n/workflows/09-retry-handler.ts`
- `n8n/workflows/10-failure-handler.ts`

### 3.5 Test token refresh

- [ ] Verify `08-token-refresh.ts` deployed
- [ ] Wait for token near expiry
- [ ] Verify `token_refresh_log` populated
- [ ] Verify `social_accounts.token_expires_at` updated

**File:** `n8n/workflows/08-token-refresh.ts`

---

## Phase 4: Monitoring, Polish & Security

### 4.1 Verify dashboard stats

- [ ] Dashboard shows real counts after publishing
- [ ] Publishing Velocity chart populates
- [ ] Upcoming Queue shows scheduled posts
- [ ] Activity Feed shows recent logs

**File:** `frontend/src/hooks/use-dashboard.ts`

### 4.2 Verify activity logs

- [ ] `/logs` page shows `post_logs` entries
- [ ] Timeline rendering is correct
- [ ] Filters work

**File:** `frontend/src/app/logs/page.tsx`

### 4.3 Fix remaining issues

- [ ] `FRONTEND_URL` CORS fix (Phase 1.3)
- [ ] Timezone "Asia/Kolkata" vs "Asia/Calcutta" fix
- [ ] Add `loading.tsx` and `error.tsx` boundaries to all route segments
- [ ] Fix `10-failure-handler.ts` import inconsistency
- [ ] Verify `post_logs` query works with denormalized `user_id`

### 4.4 Security remediation

- [ ] Audit SECURITY DEFINER functions exposed to `anon` role
- [ ] Revoke execute from `anon` for non-public functions
- [ ] Enable leaked password protection in Supabase Auth
- [ ] Run Supabase security advisor again

---

## Phase 5: End-to-End Verification

### 5.1 Full happy path

```
[ ] Landing page loads with stats API working
[ ] User registers via /auth/register
[ ] User logs in via /auth/login
[ ] User connects Facebook Page via /accounts
[ ] User uploads media via /media
[ ] User creates post via /composer
[ ] User schedules post for future
[ ] Cron picks up post and publishes
[ ] Post appears on Facebook Page
[ ] Dashboard shows updated stats
[ ] Activity Logs show publish history
[ ] Settings saves profile successfully
```

### 5.2 Error scenarios

```
[ ] Invalid Meta credentials → graceful error
[ ] Token expiry → auto-refresh or revoked status
[ ] Post publish failure → retry → fail with error message
[ ] Network failure → n8n proxy timeout handling
[ ] 404 page renders for unknown routes
[ ] Auth guard redirects unauthenticated users
```

---

## Known Issues (Logged)

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | Settings page 406 error on missing profile | 🔴 Fixed | ✅ `.single()` → `.maybeSingle()` |
| 2 | `aman@gmail.com` missing profile row | 🔴 Fixed | ✅ Inserted row |
| 3 | `FRONTEND_URL` not set in env | 🔴 High | ⏳ Pending |
| 4 | Meta OAuth buttons disabled on auth pages | 🟡 Medium | ⏳ Needs decision |
| 5 | No loading/error boundaries | 🟡 Medium | ⏳ Pending |
| 6 | Timezone dropdown mismatch (Kolkata vs Calcutta) | 🟢 Low | ⏳ Pending |
| 7 | `10-failure-handler.ts` import style | 🟢 Low | ⏳ Pending |
| 8 | SECURITY DEFINER functions exposed | 🟡 Medium | ⏳ Pending |
| 9 | Leaked password protection disabled | 🟡 Medium | ⏳ Pending |
