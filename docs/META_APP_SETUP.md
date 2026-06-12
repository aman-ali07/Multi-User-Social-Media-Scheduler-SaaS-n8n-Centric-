# Meta App Setup Guide

To use the Social Media Scheduler, you need a Facebook App to connect to Meta's APIs.

## Step 1: Create a Facebook App

1. Go to https://developers.facebook.com/
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Enter an App Name (e.g., "Social Scheduler")
5. Add your email and a Business Manager (or create one)
6. Click **Create App**

## Step 2: Add Products

In your app dashboard, add these products:

### Facebook Login
- Click **Set Up** on Facebook Login
- In **Settings** → **Valid OAuth Redirect URIs**, add:
  ```
  https://multi-user-social-media-scheduler-s.vercel.app/accounts/connect
  ```
  For local development, also add:
  ```
  http://localhost:3000/accounts/connect
  ```

### Instagram Basic Display
- Click **Set Up** and configure later

### Pages API
- Automatically available with Facebook Login

## Step 3: Get App Credentials

1. Go to **Settings** → **Basic**
2. Copy **App ID** and **App Secret**
3. Set these in n8n cloud:
   - `FACEBOOK_APP_ID` = your App ID
   - `FACEBOOK_APP_SECRET` = your App Secret

## Step 4: Configure OAuth

The OAuth redirect URL is:
```
{FRONTEND_URL}/accounts/connect
```

Where `FRONTEND_URL` is your Vercel deployment URL (e.g., `https://multi-user-social-media-scheduler-s.vercel.app`).

This must match **exactly** in:
1. Meta App → Facebook Login → Valid OAuth Redirect URIs
2. n8n env var `FRONTEND_URL`
3. n8n OAuth Connect workflow (used in the Build Redirect URL node)
4. n8n OAuth Callback workflow (used in Exchange Code node)

## Step 5: Submit for Review

Submit these permissions for review:
- `pages_manage_posts` — Create, edit, and delete posts on Facebook Pages
- `pages_read_engagement` — Read engagement data
- `instagram_basic` — Read Instagram business account data
- `instagram_content_publish` — Publish content to Instagram

## Step 6: Set App to Live

In **App Mode** toggle, switch from **Development** to **Live**.

## Step 7: Set n8n Cloud Environment Variables

In n8n Cloud dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `FACEBOOK_APP_ID` | From Step 3 |
| `FACEBOOK_APP_SECRET` | From Step 3 |
| `INTERNAL_WEBHOOK_SECRET` | Run `openssl rand -hex 32` |
| `SUPABASE_AUTH_URL` | `https://dzbkiqtzyofzcfqgundy.supabase.co/auth/v1/user` |
| `FRONTEND_URL` | Your Vercel URL or `http://localhost:3000` |
| `N8N_WEBHOOK_URL` | `https://aman01.app.n8n.cloud/` |

## Troubleshooting

- **"Invalid redirect URI"** — The redirect URI in Meta App must match `{FRONTEND_URL}/accounts/connect` exactly (no trailing slash)
- **"App not in Live mode"** — Only test users can use Development mode apps
- **"Permissions not granted"** — Ensure user accepts all requested permissions in OAuth dialog
