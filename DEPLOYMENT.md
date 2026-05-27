# Oracle Free Tier Deployment Guide

## Prerequisites
- Oracle Cloud free tier account (Ampere A1, 4 cores, 24GB RAM)
- Domain name pointed at your Oracle instance IP (for TLS)
- Meta Developer App (configured with OAuth redirect URIs)
- Supabase project (already set up: `dzbkiqtzyofzcfqgundy`)

## Steps

### 1. Provision Oracle Instance

Create an Ubuntu 24.04 VM on Oracle Cloud Ampere A1 shape.
- Open ports 80, 443, 5678
- Reserve a public IPv4 address
- Point your domain A record at it

### 2. Install Docker

```bash
ssh ubuntu@your-oracle-ip
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in
```

### 3. Clone & Configure

```bash
git clone <your-repo-url> ~/saas
cd ~/saas
cp env.example .env
# Edit .env with your values:
# - N8N_HOST, N8N_EDITOR_BASE_URL, N8N_WEBHOOK_URL → your domain
# - FACEBOOK_APP_ID, FACEBOOK_APP_SECRET → from Meta Developer Portal
# - FRONTEND_URL → your Vercel app URL
# - SUPABASE_AUTH_URL → already filled in
# - INTERNAL_WEBHOOK_SECRET → openssl rand -hex 32
```

### 4. Add Reverse Proxy (Caddy)

Create `caddy-compose.yml`:

```yaml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - caddy_data:/data
      - ./Caddyfile:/etc/caddy/Caddyfile
  n8n:
    extends:
      file: docker-compose.yml
      service: n8n

volumes:
  caddy_data:
  n8n_data:
```

Create `Caddyfile`:

```
your-domain.com {
    reverse_proxy n8n:5678
}
```

### 5. Start

```bash
docker compose -f caddy-compose.yml up -d
```

### 6. Configure n8n

- Open `https://your-domain.com`
- Sign up for the owner account
- **Settings → Environment Variables**: Set all env vars
- **Credentials → Add new → Postgres**: Point to Supabase (`postgresql://postgres:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true`)
- Each workflow will auto-assign the Postgres credential when created

### 7. Deploy Workflows

Use `n8n-mcp` (via opencode) to create workflows from the SDK files:

```bash
# Or manually: for each file in n8n/workflows/*.ts, create a new workflow in n8n UI
```

10 workflow files in `n8n/workflows/`:
| SDK File | Webhook Path | Purpose |
|----------|-------------|---------|
| 01-oauth-connect.ts | `/webhook/oauth-connect` | Generate OAuth state, build redirect URL |
| 02-oauth-callback.ts | `/webhook/oauth-callback` | Handle OAuth callback, get long-lived token |
| 04-post-crud.ts | `/webhook/post` | Create/edit/cancel posts |
| 05-cron-scheduler.ts | *(schedule trigger)* | Every 5 min: refresh tokens + dispatch pending posts |
| 06-facebook-publish.ts | `/webhook/facebook-publish` | Publish to Facebook (text/photo/carousel) |
| 07-instagram-publish.ts | `/webhook/instagram-publish` | Publish to Instagram (single/carousel with polling) |
| 08-token-refresh.ts | `/webhook/token-refresh` | Standalone token refresh (not called by new scheduler) |
| 09-retry-handler.ts | `/webhook/retry` | Exponential backoff retry logic |
| 10-failure-handler.ts | `/webhook/failure-handler` | Log exhausted retries to workflow_runs |
| 11-logging.ts | `/webhook/log` | Log workflow run data |

### 8. Required Env Vars in n8n

| Variable | Description |
|----------|-------------|
| `FACEBOOK_APP_ID` | Meta App ID |
| `FACEBOOK_APP_SECRET` | Meta App Secret |
| `FACEBOOK_TOKEN_URL` | `https://graph.facebook.com/v21.0/oauth/access_token` |
| `FRONTEND_URL` | Your Vercel deployment URL (e.g. `https://your-app.vercel.app`) |
| `N8N_WEBHOOK_URL` | `https://your-domain.com/` |
| `INTERNAL_WEBHOOK_SECRET` | Shared secret for internal webhook calls |
| `SUPABASE_AUTH_URL` | `https://dzbkiqtzyofzcfqgundy.supabase.co/auth/v1/user` |

### 9. Activate Workflows

- Activate all webhook-triggered workflows (01, 02, 04, 06, 07, 08, 09, 10, 11)
- Activate the Cron Scheduler (05) last
- Verify OAuth flow: visit `https://your-app.vercel.app/accounts`, connect Facebook

## Meta Developer Portal Configuration

- App Dashboard → Use Cases → "Other" → Business
- Add Product: Facebook Login → Configure:
  - OAuth redirect URI: `https://your-app.vercel.app/accounts/connect`
- Add Product: Instagram Basic Display
- App Review → Submit for review (for `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`)

## n8n Proxy Route

The frontend proxies all n8n webhook calls through `/api/n8n/[...path]` (Next.js API route). This:
- Injects the Supabase auth token (from the session cookie) as `Authorization: Bearer` header
- Forwards the request body
- Handles CORS

Make sure `NEXT_PUBLIC_N8N_WEBHOOK_URL` in Vercel env vars points to `https://your-domain.com/`.

## Notes

- **Cron Scheduler is unpublished on n8n.cloud** — activate only after Oracle is set up to avoid burning trial executions
- **`@n8n/workflow-sdk` is not on npm** — fresh clones need `--ignore-scripts` on `npm install`, or copy `node_modules` from a working clone
- **TLS is mandatory** — Meta OAuth requires HTTPS redirect URIs. Caddy handles this automatically with Let's Encrypt
- **Old workflows kept for reference**: `03-media-upload` (deleted SDK — uploads happen via browser RLS now), `08-token-refresh` (merged into scheduler)
- Frontend builds clean on Next.js 16.2.6 (18 routes, no warnings)
- All 10 workflows deployed and updated on n8n.cloud as of session date
