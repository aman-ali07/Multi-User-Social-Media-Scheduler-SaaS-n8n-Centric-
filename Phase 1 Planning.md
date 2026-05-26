# Phase 1 — System Understanding Artifact

## Project Overview

Multi-tenant social media scheduling SaaS (Facebook + Instagram) using Meta Graph API.
n8n is the PRIMARY backend — all business logic, orchestration, OAuth, scheduling, retries, logging.

**Stack:** Next.js (frontend) → Supabase Auth → n8n webhooks/API → Supabase DB/Storage → Meta Graph API

---

## 1. Goals & MVP Scope

### Goals
- Multi-user SaaS allowing users to connect Facebook + Instagram
- Upload media + captions
- Schedule posts with timezone support
- Auto-publish via n8n workflows
- Retry on failure with exponential backoff
- Full audit trail

### MVP Scope
| Feature | Status |
|---------|--------|
| Signup/Login (Supabase Auth) | MVP |
| Connect Facebook Page + Instagram Business Account | MVP |
| Upload media (images/videos) to Supabase Storage | MVP |
| Create drafts with captions + media | MVP |
| Schedule posts with timezone selection | MVP |
| Edit/cancel scheduled posts | MVP |
| Auto-publish via n8n cron scheduler | MVP |
| Retry mechanism (3 attempts, exponential backoff) | MVP |
| Post history/logs | MVP |
| Multi-account support (multiple FB pages) | MVP |

### V2 (Not in scope now)
Recurring posts, analytics dashboard, AI caption generation, approval workflows.

---

## 2. Architecture

```
┌─────────────┐     ┌────────────────┐     ┌───────────────┐
│  Next.js    │────▶│  n8n Backend   │────▶│  Supabase DB  │
│  Frontend   │     │  (Webhooks +   │     │  + Storage    │
│  (App Router│     │   Scheduler)   │     │               │
│   + shadcn) │     │                │     │               │
└─────────────┘     └───────┬────────┘     └───────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Meta Graph  │
                     │  API (FB+IG) │
                     └──────────────┘
```

### Data Flow
1. User authenticates via Supabase Auth (frontend)
2. Frontend calls n8n webhooks (with user's auth token for validation)
3. n8n validates user, processes request, interacts with Supabase (service role) and Meta APIs
4. n8n cron scheduler polls for pending posts and publishes them
5. All state lives in Supabase PostgreSQL

---

## 3. Database Entity Model

### Tables
| Table | Purpose |
|-------|---------|
| `profiles` | Extends Supabase auth.users; stores user preferences and timezone |
| `social_accounts` | Connected Facebook pages + Instagram Business Accounts |
| `media_assets` | Uploaded media files metadata (stored in Supabase Storage) |
| `post_media` | Junction table linking posts to media assets |
| `scheduled_posts` | Drafts and scheduled posts with all content + timing |
| `post_logs` | Execution history for each post (status, response, errors) |
| `workflow_runs` | Audit log of n8n workflow executions |
| `oauth_state` | Temporary storage for OAuth PKCE/state validation |
| `token_refresh_log` | Track token refresh attempts and outcomes |

### Entity Relationships
```
auth.users (Supabase Auth)
  └── profiles (1:1)
  └── social_accounts (1:N)
  └── media_assets (1:N)
  └── scheduled_posts (1:N)
       └── post_media (N:M with media_assets)
       └── post_logs (1:N)
  └── oauth_state (1:N)
```

---

## 4. n8n Workflow Map

| # | Workflow | Trigger | Purpose |
|---|----------|---------|---------|
| 1 | OAuth Connect | Webhook | Generate Meta OAuth URL with state |
| 2 | OAuth Callback | Webhook | Exchange code, store tokens, create social_accounts |
| 3 | Media Upload | Webhook | Validate upload, persist to storage, create media_assets record |
| 4 | Create/Edit/Cancel Post | Webhook | CRUD operations on scheduled_posts |
| 5 | Scheduler Cron | Cron (1min) | Query pending posts, dispatch to Publish workflow |
| 6 | Facebook Publish | Sub-workflow | Create FB post via Graph API |
| 7 | Instagram Publish | Sub-workflow | Create IG media container → publish |
| 8 | Token Refresh | Sub-workflow | Refresh expiring Meta access tokens |
| 9 | Retry Handler | Sub-workflow | Exponential backoff retry logic |
| 10 | Failure Handler | Sub-workflow | Log failures, notify if needed |
| 11 | Logging | All nodes | Centralized structured logging |

---

## 5. n8n Webhook API Contracts

### POST /webhook/oauth/connect
```json
{
  "userId": "uuid",
  "platform": "facebook"
}
```
Returns: `{ url: "https://facebook.com/..." }`

### GET /webhook/oauth/callback
Query: `?code=...&state=...`
Returns: `{ success: true, accountId: "uuid" }`

### POST /webhook/media/upload
Multipart: file + metadata
Returns: `{ mediaId: "uuid", url: "signed-url" }`

### POST /webhook/post/create
```json
{
  "userId": "uuid",
  "title": "string",
  "caption": "string",
  "mediaIds": ["uuid"],
  "platforms": ["facebook", "instagram"],
  "scheduleAt": "ISO8601|null",
  "timezone": "America/New_York",
  "status": "draft|scheduled"
}
```
Returns: `{ postId: "uuid" }`

### PUT /webhook/post/edit
```json
{
  "postId": "uuid",
  "caption": "string",
  "scheduleAt": "ISO8601|null",
  "status": "draft|scheduled"
}
```

### POST /webhook/post/cancel
```json
{ "postId": "uuid" }
```

### GET /webhook/posts
Query: `?userId=uuid&status=draft&limit=20&offset=0`

### GET /webhook/logs
Query: `?postId=uuid&userId=uuid`

---

## 6. Security Requirements

- Auth: Supabase Auth with RLS
- OAuth state validation (PKCE-style)
- Token encryption at rest (Supabase pgcrypto)
- Webhook signature verification (n8n webhook ID + secret)
- Upload validation: MIME type whitelist, file size limits (25MB)
- Rate limiting: n8n per-user throttle
- Audit logging: post_logs, workflow_runs tables
- CORS: restrict to frontend domain
- Supabase service_role key only used by n8n (never frontend)

---

## 7. Implementation Plan (Chunked Phases)

### Chunk 1: Foundation (Phase 2 + 3)
- [ ] Full PostgreSQL schema with all tables, indexes, RLS
- [ ] Supabase Storage buckets + policies
- [ ] SQL migration file

### Chunk 2: Meta Integration (Phase 5)
- [ ] Facebook App setup guide
- [ ] OAuth scopes + permissions documentation
- [ ] Meta Graph API endpoint reference
- [ ] Token refresh + error handling strategy

### Chunk 3: n8n Core Workflows (Phase 4, workflows 1-5)
- [ ] OAuth Connect Workflow
- [ ] OAuth Callback Workflow
- [ ] Media Upload Workflow
- [ ] Create/Edit/Cancel Post Workflow
- [ ] Scheduler Cron Workflow

### Chunk 4: n8n Publish Workflows (Phase 4, workflows 6-11)
- [ ] Facebook Publish Workflow
- [ ] Instagram Publish Workflow
- [ ] Token Refresh Workflow
- [ ] Retry Workflow
- [ ] Failure Handler Workflow
- [ ] Logging Workflow

### Chunk 5: Frontend (Phase 6)
- [ ] Next.js scaffold + shadcn/ui setup
- [ ] Auth pages (Login, Signup)
- [ ] Dashboard
- [ ] Composer (media upload + post creation)
- [ ] Scheduler view
- [ ] Drafts list
- [ ] Connected Accounts management
- [ ] Logs/History view
- [ ] Settings page

### Chunk 6: Security + Deployment (Phase 7 + 8)
- [ ] Environment variables template (.env.example)
- [ ] Token encryption setup
- [ ] Docker Compose configuration
- [ ] Reverse proxy (nginx) config
- [ ] HTTPS setup

### Chunk 7: Testing (Phase 9)
- [ ] Integration test plan
- [ ] Workflow test scenarios
- [ ] OAuth flow tests
- [ ] Failure simulations

---

## 8. Engineering Decisions & Assumptions

| Decision | Rationale |
|----------|-----------|
| n8n uses service_role key for DB | n8n is the trusted backend; RLS still enforced by service_role can bypass RLS, so n8n manages access control itself |
| Webhook auth via header + userId | Frontend sends Supabase session token; n8n verifies via Supabase Auth API |
| Instagram requires Business account | Meta API requires Instagram Business/Creator account linked to a Facebook Page |
| Token encryption at DB level | Using pgcrypto's `pgp_sym_encrypt` with a server-side key from env vars |
| Cron runs every 1 minute | Balance between timely publishing and DB load |
| Max 3 retries | Industry standard for transient API failures |
| Media stored in Supabase Storage | Not in DB; DB stores metadata + URL reference |

---

## 9. Directory Structure (Target)

```
saas/
├── PLAN.md                     # ← You are here
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── n8n/
│   ├── workflows/
│   │   ├── 01-oauth-connect.json
│   │   ├── 02-oauth-callback.json
│   │   ├── 03-media-upload.json
│   │   ├── 04-post-crud.json
│   │   ├── 05-scheduler.json
│   │   ├── 06-facebook-publish.json
│   │   ├── 07-instagram-publish.json
│   │   ├── 08-token-refresh.json
│   │   ├── 09-retry.json
│   │   ├── 10-failure-handler.json
│   │   └── 11-logging.json
│   └── credentials.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   └── package.json
├── docker/
│   ├── docker-compose.yml
│   └── nginx.conf
├── docs/
│   ├── meta-api.md
│   └── architecture.md
└── .env.example
```
