# Phase 4 — n8n Workflow Implementation Plan

## Overview

Generate 11 production-ready n8n workflows on the cloud instance at `aman01.app.n8n.cloud`.
Each workflow created via n8n Workflow SDK and validated before deployment.

---

## Approach

1. Each workflow written as TypeScript SDK code
2. Validated with `validate_workflow` MCP tool
3. Created on n8n cloud via `create_workflow_from_code`
4. Exported JSON stored locally in `n8n/workflows/` for version control

---

## Workflow Execution Order (dependency-aware)

```
1. Logging Workflow        ⬅︎ No deps (utility consumed by all others)
2. Token Refresh Workflow   ⬅︎ No deps (utility)
3. Retry Handler Workflow   ⬅︎ No deps (utility)
4. OAuth Connect            ⬅︎ No deps
5. OAuth Callback           ⬅︎ Depends on: Logging
6. Media Upload             ⬅︎ Depends on: Logging
7. Post CRUD                ⬅︎ Depends on: Logging
8. Cron Scheduler           ⬅︎ Depends on: Logging, Retry, Token Refresh
9. Facebook Publish         ⬅︎ Depends on: Token Refresh, Logging, Retry
10. Instagram Publish       ⬅︎ Depends on: Token Refresh, Logging, Retry
11. Failure Handler         ⬅︎ Depends on: Logging
```

---

## Credentials Needed (manual setup in n8n UI)

| Credential Name | Type | Used By |
|-----------------|------|---------|
| `Supabase DB` | PostgreSQL | All DB workflows |
| `Supabase Service Role` | HTTP Header Auth (Bearer token) | Media upload, OAuth callback |
| `Meta Graph API` | OAuth2 | OAuth, Publish workflows |
| `Facebook App` | Facebook Graph API | Facebook/Instagram publish |

---

## Workflow Designs

### WF-1: OAuth Connect
- **Trigger:** Webhook (`POST /webhook/oauth/connect`)
- **Nodes:** Webhook → Set (build URL params) → HTTP Request (Meta OAuth dialog) → Respond to Webhook
- **Purpose:** Generate Meta authorization URL with state parameter
- **Input:** `{ "userId": "uuid", "platform": "facebook" }`
- **Output:** `{ "url": "https://facebook.com/..." }`

### WF-2: OAuth Callback
- **Trigger:** Webhook (`GET /webhook/oauth/callback`)
- **Nodes:** Webhook → Code (validate state) → HTTP Request (exchange code for token) → HTTP Request (get pages) → HTTP Request (get IG account) → Postgres (insert social_accounts) → Respond to Webhook
- **Purpose:** Complete Meta OAuth flow, store tokens + account info

### WF-3: Media Upload
- **Trigger:** Webhook (`POST /webhook/media/upload`)
- **Nodes:** Webhook → Code (validate metadata) → Postgres (insert media_assets) → Respond to Webhook
- **Purpose:** Create media_assets DB record after frontend uploads to Storage

### WF-4: Post CRUD
- **Trigger:** Webhook (`POST/PUT/DELETE /webhook/post/*`)
- **Nodes:** Webhook → Switch (route by operation) → Postgres (create/edit/delete scheduled_posts) → Respond to Webhook
- **Purpose:** Create, edit, cancel scheduled posts

### WF-5: Cron Scheduler
- **Trigger:** Schedule Trigger (every 1 minute)
- **Nodes:** Schedule → Postgres (query pending posts) → Loop: for each post call Publish workflow
- **Purpose:** Poll for due posts and dispatch for publishing

### WF-6: Facebook Publish
- **Trigger:** Webhook (called by Scheduler)
- **Nodes:** Webhook → Postgres (fetch post + account + media) → HTTP Request (create FB post via Graph API) → Postgres (update post status) → Postgres (create post_log)
- **Purpose:** Publish to Facebook Page feed

### WF-7: Instagram Publish
- **Trigger:** Webhook (called by Scheduler)
- **Nodes:** Webhook → Postgres (fetch post) → HTTP Request (create media container) → Wait (poll) → HTTP Request (check container status) → HTTP Request (publish container) → Postgres (update status + log)
- **Purpose:** Publish to Instagram Business Account (2-step: container → publish)

### WF-8: Token Refresh
- **Trigger:** Webhook (called by Publish workflow when 401)
- **Nodes:** Webhook → Postgres (fetch account) → HTTP Request (Meta token refresh) → Postgres (update token) → Postgres (insert token_refresh_log)
- **Purpose:** Refresh expiring Meta long-lived tokens

### WF-9: Retry Handler
- **Trigger:** Webhook (called by Failure Handler)
- **Nodes:** Webhook → If (retry_count < max_retries) → Postgres (increment retry_count) → Wait (exponential backoff) → call Publish again
- **Purpose:** Exponential backoff retry (1min → 5min → 30min)

### WF-10: Failure Handler
- **Trigger:** Webhook (called by any Publish workflow on error)
- **Nodes:** Webhook → Postgres (update post status to failed + error_message) → Postgres (create error log) → If (retries remaining) → call Retry Workflow
- **Purpose:** Centralized failure recording and retry dispatch

### WF-11: Logging Workflow
- **Trigger:** Webhook (called by all other workflows)
- **Nodes:** Webhook → Postgres (insert workflow_runs record)
- **Purpose:** Centralized structured logging

---

## Implementation Strategy

```
For EACH workflow:
  1. Design → write SDK code
  2. Validate via validate_workflow
  3. If errors → fix and re-validate
  4. Create via create_workflow_from_code
  5. Export JSON and save locally
  6. Mark complete
```

---

## Stored Files

All workflows saved to: `n8n/workflows/{id}-{name}.json`

---

Ready to implement Workflow 1 (OAuth Connect) on approval.
