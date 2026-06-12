# Slice 1: Auth & Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users can register, log in, connect a Facebook Page via Meta OAuth, and see their connected accounts on the accounts page.

**Architecture:** Frontend (Next.js 16) calls n8n OAuth webhooks via Next.js API proxy (`/api/n8n/[...path]`). n8n workflows handle Meta Graph API interactions. Supabase stores OAuth state and encrypted tokens with RLS protection. The Meta OAuth flow uses PKCE for security.

**Tech Stack:** Next.js 16, React 19, `@supabase/ssr`, `@n8n/workflow-sdk`, n8n Cloud, Supabase PostgreSQL (pgcrypto), Meta Graph API v21.0

---

### Task 1: Verify Supabase database state

**Files:**
- (read-only check via supabase_execute_sql)

The encryption key is already handled by migration 006 (`app_config` table with `encryption_key` row). The `encrypt_token()` and `decrypt_token()` functions read from `app_config` instead of GUC settings.

- [ ] **Step 1: Verify all tables exist and RLS is enabled**

Run via supabase_execute_sql:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

Expected: `app_config`, `oauth_state`, `social_accounts`, `profiles`, `media_assets`, `scheduled_posts`, `post_media`, `post_logs`, `workflow_runs`, `token_refresh_log`

Also verify `app_config` has encryption key:

```sql
SELECT key, value FROM app_config WHERE key = 'encryption_key';
```

Also verify encrypt/decrypt functions:

```sql
SELECT proname FROM pg_proc WHERE proname IN ('encrypt_token', 'decrypt_token');
```

---

### Task 2: Set up environment variables

- [ ] **Step 1: Check current frontend env vars**

Frontend `.env.local` already has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_N8N_WEBHOOK_URL`, `NEXT_PUBLIC_SITE_URL`.

Verify `NEXT_PUBLIC_N8N_WEBHOOK_URL` points to `https://aman01.app.n8n.cloud/` (it does).

- [ ] **Step 2: Generate INTERNAL_WEBHOOK_SECRET**

```bash
openssl rand -hex 32
```

This secret is used by n8n workflows to authenticate internal webhook calls (scheduler → publish). It must match in the n8n env and the workflow code.

- [ ] **Step 3: Document required n8n cloud env vars for user**

The following must be set in the n8n cloud dashboard (Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `FACEBOOK_APP_ID` | From Meta App (user creates in Meta Developers) |
| `FACEBOOK_APP_SECRET` | From Meta App |
| `INTERNAL_WEBHOOK_SECRET` | Generated in Step 2 |
| `SUPABASE_AUTH_URL` | `https://dzbkiqtzyofzcfqgundy.supabase.co/auth/v1/user` |
| `FRONTEND_URL` | Vercel deployment URL (or `http://localhost:3000` for dev) |
| `N8N_WEBHOOK_URL` | `https://aman01.app.n8n.cloud/` |

---

### Task 3: Deploy OAuth n8n workflows

**Files:**
- Modify (deploy): `n8n/workflows/01-oauth-connect.ts`
- Modify (deploy): `n8n/workflows/02-oauth-callback.ts`

> The n8n cloud instance is at `aman01.app.n8n.cloud`. Workflows are deployed via the n8n REST API. The `@n8n/workflow-sdk`'s `validateWorkflow` and `generateWorkflowCode` functions generate the workflow JSON, which we can then push via the n8n MCP `create_workflow_from_code` or `update_workflow` tools.

- [ ] **Step 1: Validate OAuth Connect workflow**

```bash
node -e "
const { validateWorkflow } = require('@n8n/workflow-sdk');
const fs = require('fs');
const code = fs.readFileSync('n8n/workflows/01-oauth-connect.ts', 'utf-8');
const result = validateWorkflow(code);
console.log(JSON.stringify(result, null, 2));
"
```

- [ ] **Step 2: Validate OAuth Callback workflow**

```bash
node -e "
const { validateWorkflow } = require('@n8n/workflow-sdk');
const fs = require('fs');
const code = fs.readFileSync('n8n/workflows/02-oauth-callback.ts', 'utf-8');
const result = validateWorkflow(code);
console.log(JSON.stringify(result, null, 2));
"
```

- [ ] **Step 3: Generate workflow JSON and deploy via n8n MCP**

Use `n8n-mcp_create_workflow_from_code` or `n8n-mcp_update_workflow` with the validated workflow code from each `.ts` file.

For `01-oauth-connect.ts`:
- Workflow ID (if updating): Search for existing workflow named "OAuth Connect"
- Name: "OAuth Connect"
- Description: "Generate Meta OAuth URL with PKCE state for Facebook page connection"

For `02-oauth-callback.ts`:
- Workflow ID (if updating): Search for existing workflow named "OAuth Callback"
- Name: "OAuth Callback"
- Description: "Exchange OAuth code for token, fetch pages, store encrypted tokens"

---

### Task 4: Wire up accounts page frontend

**Files:**
- Modify: `frontend/src/app/accounts/page.tsx`
- Modify: `frontend/src/hooks/use-accounts.ts`
- Modify: `frontend/src/app/accounts/connect/route.ts`

- [ ] **Step 1: Update `use-accounts.ts` — handle connect flow with query params**

The `useAccounts` hook needs to:
1. Call `connectOAuth()` from n8n API which returns `{ redirectUrl }`
2. Redirect user to Meta dialog
3. Read `?success` or `?error` from URL on return

Current `connect()` function already does this — it calls the API and redirects. The `reload()` function refetches accounts from Supabase directly via RLS.

No changes needed to the hook itself — it already works correctly.

- [ ] **Step 2: Update `accounts/page.tsx` — handle query params for success/error feedback**

Add `useSearchParams()` to read `?success=connected`, `?error=*` from URL and show a toast/notification.

```tsx
// At top of AccountsPage function:
import { useSearchParams } from 'next/navigation'

const searchParams = useSearchParams()
const oauthSuccess = searchParams.get('success')
const oauthError = searchParams.get('error')

// After the heading section:
{oauthSuccess === 'connected' && (
  <motion.div variants={item} className="rounded-sm border border-lime/30 bg-lime/5 p-3 text-lime text-sm font-mono">
    ✓ Facebook account connected successfully
  </motion.div>
)}

{oauthError && (
  <motion.div variants={item} className="rounded-sm border border-red/30 bg-red/5 p-3 text-red text-sm font-mono">
    ✕ {oauthError === 'oauth_denied' ? 'Authorization denied. Please try again.' :
       oauthError === 'missing_params' ? 'Missing OAuth parameters from Meta.' :
       oauthError === 'callback_failed' ? 'Connection failed. Please try again.' :
       oauthError === 'token_exchange_failed' ? 'Token exchange failed. Please try again.' :
       oauthError === 'invalid_state' ? 'Invalid OAuth state. Please start over.' :
       `Connection error: ${oauthError}`}
  </motion.div>
)}
```

- [ ] **Step 3: Update `accounts/connect/route.ts` — verify OAuth callback handling**

The route already:
1. Reads `code`, `state`, `error` from query params
2. Handles `error=access_denied` → redirect `/accounts?error=oauth_denied`
3. Validates `code` and `state` exist
4. Creates Supabase server client
5. Forwards POST to n8n OAuth callback webhook with `code`+`state` + JWT
6. Handles `body.error` → redirect with error
7. On success → redirect `/accounts?success=connected`

The route looks complete. Only potential issues:
- The `FRONTEND_URL` env var needs to be set in Vercel for correct redirects
- The n8n callback webhook path must match (`oauth-callback`)

- [ ] **Step 4: Verify auth guard and proxy redirect**

The `middleware.ts` (proxy.ts) redirects unauthenticated users from console routes to `/`. The `AuthGuard` component shows a spinner while auth loads and hides content if no session. Both look complete.

---

### Task 5: Provide Meta App setup guide for user

- [ ] **Step 1: Write clear Meta App creation instructions**

The user must create a Facebook App to get `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`. Key steps:

1. Go to https://developers.facebook.com/ → Create App → Business
2. Add Facebook Login product
3. Configure OAuth redirect URI: `{FRONTEND_URL}/accounts/connect`
4. Add Instagram Basic Display product
5. Add Pages API product
6. Get App ID and App Secret from Dashboard → App Settings → Basic
7. Submit for review: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
8. Set App to Live mode
9. Set `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` in n8n cloud env

---

### Task 6: Test the full OAuth flow

- [ ] **Step 1: Start frontend dev server**

```bash
cd frontend && npm run dev
```

- [ ] **Step 2: Manual test checklist**
  - [ ] Navigate to landing page → shows hero, features, floating sign-in
  - [ ] Click sign-in → redirect to `/auth/login`
  - [ ] Register a new account → email + password
  - [ ] Verify redirect to `/dashboard` after signup
  - [ ] Navigate to `/accounts` → shows empty state
  - [ ] Click "Connect Facebook" → called `connectOAuth()` API
  - [ ] Verify redirect to Meta OAuth dialog
  - [ ] Authorize → Meta redirects to `/accounts/connect?code=X&state=Y`
  - [ ] Verify route calls n8n callback webhook
  - [ ] Verify redirect to `/accounts?success=connected`
  - [ ] Verify account card appears with page name + platform + expiry
