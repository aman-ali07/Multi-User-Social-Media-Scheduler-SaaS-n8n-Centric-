# Multi-User Social Media Scheduler — Project Context

## Motive

Build a production-grade SaaS that schedules and auto-publishes content to Facebook Pages and Instagram Business Accounts via the **Meta Graph API**, using **n8n as the primary backend** instead of a traditional server. All business logic, OAuth, scheduling, retries, and audit logging live in n8n workflows. Code is minimized in favor of visual workflow automation.

## Stack

```
Frontend (Next.js 16) ──→ n8n (backend) ──→ Supabase DB + Storage
                              │
                              ▼
                        Meta Graph API
```

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | Next.js 16 + React 19 + Tailwind CSS 4 | UI only; no API routes |
| Backend | **n8n** (11 workflows) | All business logic, orchestration |
| Auth | Supabase Auth (server-side sessions) | Login + JWT for n8n webhook auth |
| Database | Supabase PostgreSQL | 9 tables, RLS, pgcrypto encryption |
| Storage | Supabase Storage (public bucket) | Media files |
| External | Meta Graph API v21.0 | Facebook + Instagram publishing |

## Database (9 tables)

| Table | Purpose |
|-------|---------|
| `profiles` | Extends auth.users; timezone, display name |
| `oauth_state` | PKCE state for OAuth flow (TTL 10min) |
| `social_accounts` | Connected FB pages + IG business accounts |
| `media_assets` | Uploaded media metadata |
| `scheduled_posts` | Drafts + scheduled posts (soft-delete) |
| `post_media` | Junction: posts ↔ media (ordered) |
| `post_logs` | Execution history per post |
| `workflow_runs` | Audit log of n8n executions |
| `token_refresh_log` | Token refresh attempts |

All user-owned tables have RLS policies keyed to `auth.uid()`. n8n uses service_role (bypasses RLS). Frontend uses anon key + RLS for direct reads.

## n8n Workflow Map (11 workflows)

| # | Name | Trigger | Purpose |
|---|------|---------|---------|
| 1 | OAuth Connect | Webhook | Generate Meta OAuth URL with state |
| 2 | OAuth Callback | Webhook | Exchange code, store tokens, create social_accounts |
| 3 | Media Upload | Webhook | Validate upload, register media_assets record |
| 4 | Post CRUD | Webhook | Create/edit/cancel scheduled_posts |
| 5 | Scheduler Cron | Cron (1min) | Poll pending posts, dispatch publish workflows |
| 6 | Facebook Publish | Sub-workflow | Create FB post via Graph API |
| 7 | Instagram Publish | Sub-workflow | Create IG media container → publish |
| 8 | Token Refresh | Sub-workflow | Refresh expiring Meta tokens |
| 9 | Retry Handler | Sub-workflow | Exponential backoff (max 3 retries) |
| 10 | Failure Handler | Sub-workflow | Log failures, notify |
| 11 | Logging | All nodes | Centralized structured logging |

## Frontend (14 routes)

| Route | Page |
|-------|------|
| `/` | Redirect → `/dashboard` |
| `/auth/login`, `/auth/register`, `/auth/callback` | Auth pages |
| `/dashboard` | Stats row + upcoming posts + activity feed |
| `/composer`, `/composer/[id]` | New/edit post |
| `/calendar` | Month/week schedule view |
| `/posts`, `/posts/[id]` | Filterable list + detail with log timeline |
| `/accounts`, `/accounts/connect` | Connected accounts management + OAuth start |
| `/media` | Media library grid |
| `/logs` | Activity log timeline |
| `/settings`, `/settings/appearance` | Profile + theme |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| n8n IS the backend | No Next.js API routes, no Express — webhooks are the API |
| Direct Supabase reads | RLS-protected reads bypass n8n for speed; n8n handles all writes |
| Public storage bucket | Meta API needs public URLs at publish time (days after upload) |
| Page tokens never expire | Stored once; only user tokens need periodic refresh (60-day cycle) |
| "Signal" design system | Warm-dark broadcast-control-room aesthetic, no shadcn/ui |

## Current Status

- Database: Deployed (2 migrations: schema + storage setup with RLS, indexes, triggers, encryption helpers)
- n8n: Partially built — Facebook/Instagram publish, token refresh, retry, logging, failure handler workflows exist
- Frontend: Fully scaffolded — all 14 routes, all components built, Supabase queries, n8n webhook client, TypeScript types, custom fonts (Bilderberg + Satoshi)
- Remaining: Complete remaining n8n workflows (OAuth, CRUD, cron scheduler), wire frontend to live backend, deploy
