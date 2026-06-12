# SaaS Production Readiness — Full Specification

## Overview

Complete the Multi-User Social Media Scheduler from its current scaffolded/partial state to a fully functioning production SaaS. The product lets users connect Facebook Pages and Instagram Business Accounts via Meta OAuth, schedule posts (text/image/video), and auto-publish at the right time through n8n workflows.

## Approach: 6 Vertical Slices

Each slice is self-contained, demo-able, and adds a complete feature end-to-end.

```
Slice 1: Auth & Accounts      OAuth end-to-end + accounts management
Slice 2: Media & Composer     Upload media + create/edit posts
Slice 3: Scheduling & Pub     Cron publish, FB/IG publish, retry, failure
Slice 4: Dashboard & Logs     Real stats, activity feed, publishing velocity
Slice 5: Polish & Hardening   Error boundaries, empty/loading states, security
Slice 6: Launch Prep          Stripe billing, monitoring, SEO, docs, E2E tests
```

---

## Slice 1: Auth & Accounts

**Goal:** User registers → logs in → connects a Facebook Page → sees it on accounts page.

### Infra Setup (one-time, done before any coding)

| Task | Details |
|------|---------|
| Set n8n cloud env vars | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `INTERNAL_WEBHOOK_SECRET`, `SUPABASE_AUTH_URL`, `FRONTEND_URL`, `N8N_WEBHOOK_URL` |
| Set Vercel env vars | `NEXT_PUBLIC_N8N_WEBHOOK_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_FRONTEND_URL` |
| Set Supabase config | `app.encryption_key` via `ALTER SYSTEM SET app.encryption_key` |
| Publish n8n workflows | Publish latest draft of `01-oauth-connect.ts` and `02-oauth-callback.ts` |
| Create Meta App | User creates FB app, gets App ID + Secret, submits for review |

### Frontend Changes

| File | Change |
|------|--------|
| `accounts/page.tsx` | Add query param handling: show success toast on `?success=connected`, show error banner on `?error=*` |
| `hooks/use-accounts.ts` | Wire `connect()` to call n8n OAuth webhook, handle redirectURL response |
| `accounts/connect/route.ts` | Already reads `code`+`state`, forwards to n8n callback webhook, redirects on result |
| `components/accounts/account-card.tsx` | Already displays page name, platform, IG handle, token expiry, status badge |
| `components/accounts/connect-button.tsx` | Already exists, needs no changes |

### Database
- Verify RLS policies allow user to read own `social_accounts` (already deployed in migration 001)
- `encrypt_token()` / `decrypt_token()` functions already deployed

### Files Created/Modified: ~6

---

## Slice 2: Media & Composer

**Goal:** User uploads images/videos → sees them in media library → creates a draft or scheduled post.

### n8n: Publish Workflow
- Publish `04-post-crud.ts` (CRUD operations already built: create/edit/cancel)

### Frontend Changes

| File | Change |
|------|--------|
| `composer/page.tsx` | Already calls `createPost()` via n8n client. Handle error states, add form validation |
| `hooks/use-media.ts` | Already uploads to Supabase Storage + inserts row in `media_assets` |
| `media/page.tsx` | Show uploaded media grid, loading state, empty state |
| `lib/n8n.ts` | `createPost()`, `updatePost()`, `cancelPost()` already defined |
| `lib/queries.ts` | `getMyPosts()`, `getPostById()`, `getMyMedia()` already defined |
| `components/composer/media-dropzone.tsx` | File picker + preview |
| `components/composer/caption-editor.tsx` | Rich text area |
| `components/composer/platform-selector.tsx` | FB/IG toggle |
| `components/composer/schedule-picker.tsx` | Date/time picker |
| `components/composer/account-selector.tsx` | Dropdown of connected accounts |

### Files Modified: ~9

---

## Slice 3: Scheduling & Publishing

**Goal:** Cron picks up scheduled posts → dispatches to Facebook/Instagram → handles retries → logs failures.

### n8n: Publish & Activate
- Activate `05-cron-scheduler.ts` (currently inactive)
- Publish latest drafts of `06-facebook-publish.ts`, `07-instagram-publish.ts`, `08-token-refresh.ts`, `09-retry-handler.ts`, `10-failure-handler.ts`

### Frontend Changes

| File | Change |
|------|--------|
| `posts/page.tsx` | Filterable list of posts with status, apply RLS queries |
| `posts/[id]/page.tsx` | Post detail with log timeline |
| `components/posts/` | Post-specific components |

### Database
- Verify `idx_scheduled_posts_status_schedule` partial index is working (already in migration 001)

### Files Modified: ~5

---

## Slice 4: Dashboard & Logs

**Goal:** Dashboard shows real stats, publishing velocity chart, upcoming posts, activity feed. Logs page shows all activity.

### Frontend Changes

| File | Change |
|------|--------|
| `dashboard/page.tsx` | Already uses `useDashboard()` hook, shows StatsRow + PublishingVelocity + UpcomingList + ActivityFeed. Wire to live data |
| `hooks/use-dashboard.ts` | Already queries Supabase for all 7 data points in parallel |
| `logs/page.tsx` | Activity timeline from `post_logs` |
| `components/dashboard/` | StatsRow, PublishingVelocity, UpcomingList, ActivityFeed already built |

### API
- Verify `api-global-stats` endpoint works (returns public stats for landing page)

### Files Modified: ~4

---

## Slice 5: Polish & Hardening

**Goal:** Add loading states, error boundaries, empty states, responsive fixes, form validation, security remediation.

| Task | Details |
|------|---------|
| `loading.tsx` per route segment | Add to each route group (auth, dashboard, composer, calendar, posts, media, accounts, logs, settings) |
| `error.tsx` per route segment | Add to each route group with retry button |
| Empty states | All list pages show helpful empty states (already have basic ones in accounts, dashboard) |
| Form validation | Composer: validate caption length, media size/type, schedule date |
| Security | Revoke SECURITY DEFINER from `anon`, enable leaked password protection, run security advisor |
| Fix 7 known issues | Timezone Kolkata/Calcutta, failure-handler import style, post_logs user_id query, etc. |
| Notification toast component | `components/ui/toast.tsx` — for success/error feedback across the app |

### Files Modified: ~20+

---

## Slice 6: Launch Prep

**Goal:** Add Stripe billing, subscription tiers, pricing page, monitoring, SEO, E2E tests, documentation.

### Business Layer

| Task | Details |
|------|---------|
| Stripe integration | Webhook handler in Next.js, subscription tiers (Free: 1 account/10 posts, Pro: 10 accounts/unlimited, Business: unlimited + team) |
| Pricing page | New route + landing page section |
| Usage limits | Enforce in n8n Post CRUD workflow (check `social_accounts` count, `scheduled_posts` count) |
| Team/orgs | Future scope — not in v1 |

### Production Infrastructure

| Task | Details |
|------|---------|
| Sentry | Error monitoring for frontend + n8n |
| Uptime monitoring | Better Uptime or similar for n8n webhooks |
| Vercel Analytics | Page views, performance |
| SEO | Meta tags, sitemap, Open Graph for landing page |
| E2E tests | Playwright: auth flow, create post, schedule, publish |
| Documentation | User guide, API docs for webhook contracts |

### Files Modified: ~15+

---

## Architecture Summary

```
User ──→ Vercel (Next.js 16) ──→ n8n Cloud (webhooks) ──→ Supabase DB
                                      │
                                      ▼
                                Meta Graph API v21.0
                                      │
                                      ▼
                              Facebook / Instagram

Frontend reads:   Supabase directly via RLS (anon key)
Frontend writes:  n8n webhooks via Next.js API proxy (/api/n8n/[...path])
n8n internal:     x-internal-token header for sub-workflow calls
Tokens:           pgp_sym_encrypt at rest, decrypt_token() on read
Scheduling:       Cron workflow polls every 5min with SKIP LOCKED
```

## Data Flow Per Slice

### Slice 1 Flow
```
[User clicks "Connect Facebook"]
  → Frontend calls POST /api/n8n/oauth-connect
  → Next.js proxy adds JWT, forwards to n8n webhook
  → n8n verifies JWT, generates PKCE state, stores in oauth_state
  → n8n returns Meta OAuth URL
  → Frontend redirects user to Meta dialog
  → User authorizes → Meta redirects to /accounts/connect?code=X&state=Y
  → Next.js route handler POST to n8n oauth-callback webhook
  → n8n exchanges code, fetches pages, stores encrypted tokens
  → User redirected to /accounts?success=connected
  → Frontend queries social_accounts via RLS, shows connected pages
```

### Slice 3 Flow
```
[Cron runs every 5min]
  → n8n queries scheduled_posts WHERE status='scheduled' AND schedule_at <= NOW()
  → FOR UPDATE SKIP LOCKED (prevents double-publish)
  → Decrypts access token via decrypt_token()
  → Dispatches to facebook-publish or instagram-publish webhook
  → On success: UPDATE status='published', INSERT post_logs
  → On failure: Call retry handler → exponential backoff (2^n * 5 min)
  → After 3 failures: Call failure handler → mark post 'failed'
```
