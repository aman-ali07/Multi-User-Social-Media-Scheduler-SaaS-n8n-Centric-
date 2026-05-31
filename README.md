# Multi-User Social Media Scheduler

Schedule and auto-publish content to Facebook Pages and Instagram Business Accounts
via Meta Graph API. n8n is the backend — all business logic, OAuth, scheduling,
retries, and audit logging live in n8n workflows.

## Stack

```
Frontend (Next.js 16) ──→ n8n (backend) ──→ Supabase DB + Storage
                              │
                              ▼
                        Meta Graph API v21.0
```

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | **n8n** (10 workflows, webhook-driven) |
| Auth | Supabase Auth (server-side sessions + JWT) |
| Database | Supabase PostgreSQL (9 tables, RLS, pgcrypto) |
| Storage | Supabase Storage (public media bucket) |
| External | Meta Graph API v21.0 (Facebook + Instagram) |

## Quick Start

```bash
npm install && cd frontend && npm install && cd ..
# Set up frontend/.env.local (see SETUP.md)
npm run dev  # → http://localhost:3000
```

Full setup guide: **[SETUP.md](./SETUP.md)**

## Project Structure

```
saas/
├── frontend/          # Next.js 16 app (18 routes)
├── n8n/workflows/     # n8n workflow SDK source (10 .ts files)
├── supabase/migrations/  # Database schema (7 migrations)
├── docker-compose.yml # n8n self-hosted deployment (local dev)
└── n8n.env.example    # Required environment variables for n8n
```

## Architecture

- **n8n IS the backend** — no Express/Fastify/Next.js API routes. The frontend
  calls n8n webhooks for writes and Supabase directly (with RLS) for reads.
- **Auth** — Supabase Auth handles login. A `Verify Auth` Code node in each
  external-facing n8n workflow validates the JWT from the frontend proxy.
- **Tokens** — Facebook page access tokens are encrypted at rest in the database
  using `pgp_sym_encrypt`/`decrypt_token()`.
- **Scheduling** — A cron workflow polls `scheduled_posts` every 5 minutes,
  dispatches due posts to the Facebook/Instagram publish workflows.

Detailed context: **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)**

## Workflows

| # | Name | Trigger | Purpose |
| 1 | OAuth Connect | Webhook | Generate Meta OAuth URL |
| 2 | OAuth Callback | Webhook | Exchange code, store encrypted tokens |
| 3 | Post CRUD | Webhook | Create/edit/cancel scheduled posts |
| 4 | Cron Scheduler | Every 5 min | Poll pending posts, dispatch publish |
| 5 | Facebook Publish | Webhook | Create post via Graph API |
| 6 | Instagram Publish | Webhook | Create media container → publish |
| 7 | Token Refresh | Webhook | Refresh expiring Meta page tokens |
| 8 | Retry Handler | Webhook | Exponential backoff (max 3 retries) |
| 9 | Failure Handler | Webhook | Log final failures |
| 10 | Logging | Webhook | Centralized audit log |
