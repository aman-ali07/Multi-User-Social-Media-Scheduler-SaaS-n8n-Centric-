# Setup Guide

## Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Node.js | >=20 | n8n SDK + Next.js 16 |
| npm | >=10 | Package management |
| Supabase account | free tier | Database, Auth, Storage |
| n8n instance | any | Backend — cloud or self-hosted |
| Meta Developer account | free | Facebook App for Graph API |

---

## 1. Clone & Install

```bash
git clone <repo-url> && cd saas

# Install root deps (n8n SDK — internal tool, not on npm registry)
npm install

# Install frontend deps
cd frontend && npm install && cd ..
```

**Known issue:** `@n8n/workflow-sdk` is not published on the public npm registry.
If `npm install` fails on it, run `npm install --ignore-scripts` at root; the SDK
is only needed at deploy-time and the n8n backend accepts raw SDK code directly.

---

## 2. Supabase

### Database

Apply migrations against your Supabase project:

```bash
# Option A: Supabase CLI
supabase link --project-ref <project-id>
supabase db push

# Option B: Supabase Dashboard → SQL Editor
# Manually run files from supabase/migrations/ in order:
#   001 → 002 → 003 → 006 → 007 → 008 → 009
#   (004 and 005 are empty placeholders superseded by 006)
```

### Environment Variables

Set these in `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://<n8n-instance>/
```

Get the anon key from **Supabase Dashboard → Settings → API → Project API keys → anon/public**.

### Storage

The `media` bucket is created by migration 002. Verify:

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'media';
```

Expected: `media | media | true`

---

## 3. n8n

### 3a. n8n Cloud

Set these in **Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `FACEBOOK_APP_ID` | From Meta Developer Dashboard |
| `FACEBOOK_APP_SECRET` | From Meta Developer Dashboard |
| `FACEBOOK_TOKEN_URL` | `https://graph.facebook.com/v21.0/oauth/access_token` |
| `FRONTEND_URL` | `https://<your-frontend>.vercel.app` |
| `INTERNAL_WEBHOOK_SECRET` | Random hex string — generate with `openssl rand -hex 32` |
| `N8N_WEBHOOK_URL` | Your n8n instance URL with trailing slash |

### 3c. Postgres Credential

Create a credential in n8n:

- **Type:** PostgreSQL
- **Name:** `Supabase DB`
- **Host:** `aws-0-<region>.pooler.supabase.com`
- **Port:** `6543` (session pooler) or `5432` (transaction pooler)
- **Database:** `postgres`
- **User:** `postgres.<project-ref>`
- **Password:** Your Supabase database password
- **SSL:** Required

Find these in **Supabase Dashboard → Database → Connection string → URI**.

The credential name **must** match `newCredential('Supabase DB')` in the SDK files.

### 3d. Deploy Workflows

The source of truth is the `.ts` SDK files in `n8n/workflows/`. To deploy:

```bash
# Using n8n API (recommended for self-hosted):
# - Use the n8n MCP tools (validate_workflow → create_workflow_from_code)
# - Or paste SDK code into n8n UI → Import → From Code

# Using JSON export:
# - n8n SDK can compile .ts → .json (run the SDK script directly)
# - Then import the .json files via n8n UI
```

Workflow order (they have cross-dependencies):
1. `11-logging` (no deps)
2. `10-failure-handler` (no deps)
3. `09-retry-handler` (depends on 10)
4. `08-token-refresh` (no deps)
5. `06-facebook-publish` (depends on 09)
6. `07-instagram-publish` (depends on 09)
7. `05-cron-scheduler` (depends on 06, 07)
8. `01-oauth-connect`, `02-oauth-callback`, `03-media-upload`, `04-post-crud` (no deps)

---

## 4. Meta/Facebook App

1. Go to [Meta Developer Dashboard](https://developers.facebook.com/)
2. Create or select your app
3. Add **Facebook Login** product
4. Add **Instagram Graph API** (if Instagram publishing needed)
5. Configure **Valid OAuth Redirect URIs**:
   - `https://<n8n-instance>/webhook/oauth-callback`
6. Copy **App ID** and **App Secret** → set in n8n env vars
7. Ensure app is in **Live mode** (not Development) for production

Required permissions: `pages_manage_posts`, `pages_read_engagement`,
`instagram_basic`, `instagram_content_publish`

---

## 5. Run Frontend

```bash
cd frontend
npm run dev
```

Opens at `http://localhost:3000`. The landing page fetches global stats
from the API; logged-in pages require a Supabase account.

---

## Architecture Notes

### n8n IS the backend

- **All writes** go through n8n webhooks (create post, connect account, upload media)
- **All reads** go directly to Supabase via the browser client with RLS
- n8n workflows use `service_role` (bypasses RLS) for writes
- Frontend uses `anon` key (RLS enforced) for reads
- Exception: OAuth callback is proxied through a Next.js API route

### Auth flow

```
User logs in (Supabase Auth) → session has JWT
Frontend calls n8n webhook via /api/n8n/* proxy → adds Authorization header
n8n Verify Auth node calls Supabase /auth/v1/user → validates JWT
Verified userId is used for all subsequent DB operations
```

### Workflow patterns

- **External** (user-facing): OAuth Connect, OAuth Callback, Media Upload, Post CRUD
  — have `Verify Auth` node, receive requests from frontend
- **Internal** (service-facing): Facebook Publish, Instagram Publish, Retry Handler,
  Failure Handler, Token Refresh, Logging — called by the Cron Scheduler,
  all require `x-internal-token` header matching `INTERNAL_WEBHOOK_SECRET` env var
- **Scheduler**: Cron-triggered, polls `scheduled_posts`, dispatches to publish
  workflows via internal HTTP calls

### Modifying workflows

1. Edit the `.ts` file in `n8n/workflows/`
2. Test locally if possible (the SDK can validate syntax)
3. Deploy via n8n API or UI
4. Run `graphify update .` to keep the knowledge graph current

### Database migrations

New migrations go in `supabase/migrations/` with sequential numbering:
`008_<description>.sql`. Apply in Supabase Dashboard → SQL Editor or via CLI.
Do not modify existing migrations — create new ones to replace functions/triggers.

---

## Meta

### Key files

| File | Purpose |
|------|---------|
| `frontend/src/` | Next.js app |
| `n8n/workflows/*.ts` | n8n workflow SDK source |
| `supabase/migrations/` | Database schema |
| `docker-compose.yml` | n8n self-hosted deployment |
| `n8n.env.example` | Required environment variables for n8n |

### Helpful commands

```bash
# Frontend
npm run dev        # Development server
npm run build      # Production build
npm run lint       # ESLint

# Graph (if installed)
graphify update .  # Update knowledge graph after changes
graphify explain <concept>   # Understand architecture component

# Supabase (if CLI installed)
supabase db push   # Apply migrations
supabase db pull   # Sync migrations from server
```
