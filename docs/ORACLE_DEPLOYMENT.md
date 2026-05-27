# Oracle Free Tier Deployment Guide

## Prerequisites

- [Oracle Cloud free tier account](https://www.oracle.com/cloud/free/) (Ampere A1 instance — 4 cores, 24GB RAM, 200GB storage)
- A domain name pointed at your Oracle instance (required for Meta OAuth HTTPS)
- Supabase project credentials
- Facebook App credentials

---

## 1. Provision Oracle Instance

1. Create an **Ampere A1** VM (Ubuntu 22.04/24.04 LTS)
2. Open ports in security list: `22`, `80`, `443`, `5678`
3. Reserve a **public static IP** and attach it to the instance
4. Point your domain's DNS `A` record to this IP

---

## 2. Install Docker

```bash
ssh ubuntu@your-instance-ip

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose-plugin
```

---

## 3. Clone Repo & Configure

```bash
git clone https://github.com/your-org/saas.git
cd saas
cp env.example .env
```

Edit `.env` with your values:

```bash
N8N_HOST=your-domain.com
N8N_EDITOR_BASE_URL=https://your-domain.com
N8N_WEBHOOK_URL=https://your-domain.com/

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_TOKEN_URL=https://graph.facebook.com/v21.0/oauth/access_token

INTERNAL_WEBHOOK_SECRET=<run: openssl rand -hex 32>

FRONTEND_URL=https://your-frontend.vercel.app

SUPABASE_AUTH_URL=https://<project-ref>.supabase.co/auth/v1/user
```

> **Frontend note:** The frontend (Next.js) deploys separately to Vercel. `FRONTEND_URL` is its public URL used for OAuth redirects.

---

## 4. Set Up Reverse Proxy (Caddy)

Create `Caddyfile` in the project root:

```caddy
your-domain.com {
    reverse_proxy n8n:5678
}
```

Update `docker-compose.yml` to include Caddy:

```yaml
services:
  caddy:
    image: caddy:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - n8n

  n8n:
    # ... existing config ...
```

Add volumes:

```yaml
volumes:
  n8n_data:
  caddy_data:
  caddy_config:
```

---

## 5. Start Services

```bash
docker compose up -d
```

Verify: `https://your-domain.com/healthz` should respond.

---

## 6. Configure n8n

1. Open `https://your-domain.com` and complete n8n setup (create admin account)
2. Go to **Settings → Credentials** and create a **Postgres** credential named `Supabase DB`:
   - Connect to your Supabase project's Postgres connection string
   - Use the **session pooler** connection string from Supabase dashboard
   - Host: `aws-0-<region>.pooler.supabase.com`
   - Port: `6543` (session pooler)
   - Database: `postgres`
   - User: `postgres.<project-ref>`
   - Password: your project password
   - SSL: required
3. Go to **Settings → Environment Variables** and set:

| Variable | Value |
|----------|-------|
| `FACEBOOK_APP_ID` | Your Facebook App ID |
| `FACEBOOK_APP_SECRET` | Your Facebook App Secret |
| `FACEBOOK_TOKEN_URL` | `https://graph.facebook.com/v21.0/oauth/access_token` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` |
| `N8N_WEBHOOK_URL` | `https://your-domain.com/` |
| `INTERNAL_WEBHOOK_SECRET` | The random hex secret you generated |
| `SUPABASE_AUTH_URL` | `https://<ref>.supabase.co/auth/v1/user` |

---

## 7. Deploy Workflows

### Option A: Via opencode + n8n MCP (recommended)

Point the n8n MCP server at your self-hosted instance:

```json
{
  "n8n": {
    "baseUrl": "https://your-domain.com",
    "apiKey": "your-n8n-api-key"
  }
}
```

Then use `n8n-mcp_create_workflow_from_code` for each SDK file in `n8n/workflows/`.

### Option B: Manual creation in n8n UI

For each `.ts` file in `n8n/workflows/`, create a new workflow in n8n matching the SDK code. Follow the node structure:

1. **01-oauth-connect.ts** — Webhook → Verify Auth → Generate OAuth State → Store State → Build Redirect URL → Respond
2. **02-oauth-callback.ts** — Webhook → Verify Auth → Lookup State → State Valid? → Exchange Code → ... → Respond
3. **04-post-crud.ts** — Webhook → Verify Auth → Route by Operation → Create/Edit/Cancel flows
4. **05-cron-scheduler.ts** — Schedule (5min) → Fetch Expiring Tokens → Refresh → Fetch Pending Posts → Dispatch
5. **06-facebook-publish.ts** — Webhook → Verify Internal Token → Route by Media → Publish → Log
6. **07-instagram-publish.ts** — Webhook → Verify Internal Token → Route by Media → Create Container → Poll → Publish → Log
7. **09-retry-handler.ts** — Webhook → Verify Internal Token → Check Post → Retries? → Backoff → Reschedule
8. **10-failure-handler.ts** — Webhook → Verify Internal Token → Mark Failed → Log to workflow_runs → Respond
9. **11-logging.ts** — Webhook → Verify Internal Token → Insert workflow_runs → Respond

> **Note:** Media workflow (03) is no longer needed — the frontend uploads directly via Supabase Storage + RLS.

---

## 8. Activate Workflows

In n8n UI, activate these trigger workflows:

| Workflow | Trigger | Active? |
|----------|---------|---------|
| OAuth Connect | Webhook | Yes |
| OAuth Callback | Webhook | Yes |
| Post CRUD | Webhook | Yes |
| Cron Scheduler | Schedule (5min) | Yes |
| Facebook Publish | Webhook | Yes |
| Instagram Publish | Webhook | Yes |
| Retry Handler | Webhook | Yes |
| Failure Handler | Webhook | Yes |
| Logging | Webhook | Yes |

---

## 9. Verify End-to-End

1. **Auth flow:** Visit frontend → Login → Connect Facebook → OAuth should complete
2. **Composer:** Create a draft post with media → should save to DB
3. **Scheduling:** Schedule a post → wait for cron to pick it up → verify publish
4. **Token refresh:** Check post_logs after 24h → tokens should auto-refresh

---

## 10. Maintenance

### Logs retention
Clean old logs periodically:
```sql
SELECT cleanup_old_logs(30); -- Keep 30 days
```

### Token refresh
The cron scheduler handles this automatically. Monitor `post_logs` for token refresh failures.

### Updates
```bash
git pull
docker compose down
docker compose up -d
```

---

## Troubleshooting

### "Unauthorized" from n8n webhooks
- Verify `SUPABASE_AUTH_URL` env var in n8n settings
- Check user has active Supabase session (not expired)

### OAuth "invalid_state" error
- The `oauth_state` entry expired (10min window). Retry connecting.
- Check `FRONTEND_URL` matches exactly what Meta sends the redirect to.

### Posts not publishing
- Check cron scheduler logs in n8n execution history
- Verify `INTERNAL_WEBHOOK_SECRET` matches across all workflows
- Check `N8N_WEBHOOK_URL` ends with `/`

### SSL/HTTPS issues
- Meta OAuth requires HTTPS for redirect URIs
- Caddy auto-provisions Let's Encrypt certificates
- Ensure port 443 is open in Oracle firewall
