# Console — Multi-User Social Media Scheduler

A SaaS platform for scheduling and publishing content to Facebook and Instagram. Users connect their Meta business pages, create posts with media, schedule them, and the system publishes automatically via n8n workflows.

> **Audience:** This document is the single source of truth for the development team — engineers onboarding, reviewing, or contributing to the codebase. It covers architecture, conventions, data model, security, and operations. If you need to understand how any part of the system works, start here.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | n8n Cloud (workflow automation) |
| **Database** | Supabase (PostgreSQL + Storage + Auth) |
| **Auth** | Supabase Auth (email/password) |
| **Social API** | Meta Graph API (Facebook + Instagram) |
| **Analytics** | Vercel Analytics, Sentry (error tracking) |
| **Hosting** | Vercel (frontend), n8n Cloud (workflows), Supabase (DB) |
| **Animation** | Framer Motion |
| **Fonts** | Satoshi (sans), Bilderberg (serif), JetBrains Mono (mono) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  Landing / Auth / Console (Dashboard, Composer, Posts ...)   │
└────┬───────┬──────────────────────┬──────────────────────────┘
     │       │                      │
     │ ①     │ ②                    │ ③
     ▼       ▼                      ▼
┌─────────┐ ┌─────────────────┐ ┌──────────────────────────────┐
│ Supabase│ │ Next.js API     │ │ Next.js Middleware (proxy.ts) │
│ Auth    │ │ /api/n8n/[...]  │ │ Auth guard + route protection│
│ (login) │ │ JWT → n8n proxy │ └──────────────────────────────┘
└─────────┘ └───────┬─────────┘
                    │ POST + Bearer JWT
                    ▼
┌──────────────────────────────────────────────────────────────┐
│                   n8n Cloud (aman01.app.n8n.cloud)            │
│                                                              │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐     │
│  │ OAuth Connect │  │ Post CRUD  │  │ Cron Scheduler    │     │
│  │ 01, 02        │  │ 04         │  │ 05 (every 5 min)  │     │
│  └──────┬───────┘  └─────┬──────┘  └────────┬─────────┘     │
│         │                │                   │               │
│         ▼                ▼                   ▼               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Facebook Publish (06)   Instagram Publish (07)      │   │
│  │  Token Refresh (08)      Retry Handler (09)          │   │
│  │  Failure Handler (10)    Logging (11)                │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│                  service_role (bypass RLS)                   │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL                         │
│  profiles | oauth_state | social_accounts | media_assets      │
│  scheduled_posts | post_media | post_logs | workflow_runs     │
│  token_refresh_log | app_config                               │
│                                                              │
│  Storage: media/ bucket (user-scoped folders)                 │
│  RLS: All tables user-scoped via auth.uid()                   │
│  Encryption: AES-256 (pgp_sym_encrypt, key in app_config)     │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

**① Reads (frontend → Supabase directly):**
Browser Supabase client (`createBrowserClient`) with anon key → RLS enforces `user_id = auth.uid()`.

**② Writes (frontend → n8n → Supabase):**
Browser → `POST /api/n8n/[...path]` (Next.js API route adds JWT from session) → n8n webhook → n8n Postgres node (service_role, bypasses RLS).

**③ OAuth Flow:**
Click "Connect Facebook" → `POST /api/n8n/oauth-connect` → n8n generates PKCE state, stores it, returns Meta OAuth URL → Browser redirects to Meta → User authorizes → Meta redirects to `/accounts/connect?code=X&state=Y` → Next.js route handler POSTs to n8n oauth-callback → n8n exchanges code, fetches pages, encrypts tokens, stores accounts → Redirect to `/accounts?success=connected`.

**④ Scheduling Pipeline:**
User schedules post → Post CRUD workflow inserts `scheduled_posts` row → Cron Scheduler (every 5 min) polls `FOR UPDATE SKIP LOCKED` → dispatches to Facebook or Instagram publish workflow → n8n calls Meta Graph API → updates status → on failure: Retry Handler (exponential backoff, 2^n × 5 min, max 3) → on final failure: Failure Handler logs to `workflow_runs`.

---

## Directory Structure

```
saas/
├── PROJECT_DOCUMENTATION.md        # ← This file
├── README.md
├── SETUP.md
├── AGENTS.md                       # Graphify agent instructions
├── package.json                    # Root: @n8n/workflow-sdk dep
├── docker-compose.yml              # n8n self-hosted + nginx + certbot
├── .env.example                    # n8n env template
├── n8n.env.example                 # n8n env template (detailed)
│
├── frontend/                       # Next.js 16 application
│   ├── package.json
│   ├── next.config.ts              # Sentry-wrapped config
│   ├── tsconfig.json
│   ├── playwright.config.ts        # E2E test config
│   ├── vercel.json
│   ├── .env.local                  # Local env vars (gitignored)
│   │
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   │   ├── layout.tsx          # Root: fonts, metadata, noise overlay, Analytics
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── globals.css         # Tailwind v4 theme (dark palette)
│   │   │   ├── loading.tsx         # Root loading skeleton
│   │   │   ├── not-found.tsx       # 404 page
│   │   │   ├── global-error.tsx    # Sentry global error boundary
│   │   │   ├── manifest.ts         # PWA manifest
│   │   │   ├── robots.ts           # SEO robots
│   │   │   ├── sitemap.ts          # SEO sitemap
│   │   │   │
│   │   │   ├── auth/               # Auth routes
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── callback/page.tsx
│   │   │   ├── dashboard/          # Stats, velocity, upcoming, activity
│   │   │   ├── accounts/           # Social accounts list + OAuth connect
│   │   │   │   └── connect/route.ts # OAuth callback handler
│   │   │   ├── composer/           # Post composer + edit page
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── calendar/           # Calendar view
│   │   │   ├── posts/              # Post list + detail with logs
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── media/              # Media library
│   │   │   ├── logs/               # Activity logs
│   │   │   ├── settings/           # User settings
│   │   │   │   └── appearance/page.tsx
│   │   │   └── api/                # API routes
│   │   │       ├── n8n/[...path]/route.ts  # JWT-authed proxy to n8n
│   │   │       └── stats/global/route.ts   # Public landing page stats
│   │   │
│   │   ├── components/
│   │   │   ├── accounts/    # AccountCard, ConnectButton
│   │   │   ├── auth/        # AuthForm, AuthGuard, AuthLayout, MotionNarrative
│   │   │   ├── calendar/    # CalendarGrid, DayCell
│   │   │   ├── composer/    # AccountSelector, CaptionEditor, MediaDropzone,
│   │   │   │                # PlatformSelector, SchedulePicker
│   │   │   ├── dashboard/   # ActivityFeed, PublishingVelocity, StatsRow, UpcomingList
│   │   │   ├── landing/     # HeroSection, FeaturesSection, HowItWorks, StatsBar,
│   │   │   │                # Footer, FloatingSignIn, TopographicLines
│   │   │   ├── logs/        # ActivityTimeline
│   │   │   ├── media/       # MediaGrid
│   │   │   ├── posts/       # FilterBar, PostRow
│   │   │   ├── shell/       # ConsoleShell, LeftNav, TopBar, StatusBar
│   │   │   └── ui/          # Button, Input, Badge, Skeleton, Toast, ErrorBoundary
│   │   │
│   │   ├── hooks/           # use-auth, use-accounts, use-dashboard, use-calendar,
│   │   │                    # use-media, use-posts, use-settings
│   │   ├── lib/             # supabase.ts (browser client), n8n.ts (webhook client),
│   │   │                    # queries.ts (Supabase query helpers), utils.ts
│   │   ├── types/           # database.ts (all TypeScript interfaces)
│   │   ├── proxy.ts         # Next.js middleware: auth guard
│   │   ├── instrumentation.ts              # Sentry server + edge init
│   │   ├── instrumentation-client.ts        # Sentry client init
│   │   ├── sentry.server.config.ts
│   │   └── sentry.edge.config.ts
│   │
│   ├── e2e/                 # Playwright tests
│   │   ├── auth.spec.ts
│   │   ├── composer.spec.ts
│   │   ├── dashboard.spec.ts
│   │   └── navigation.spec.ts
│   │
│   ├── public/fonts/        # Satoshi (5 weights) + Bilderberg (2 variants)
│   │
│   └── docs/                # User-facing docs
│       ├── USER_GUIDE.md
│       └── UP_TIME_MONITORING.md
│
├── supabase/
│   └── migrations/          # 15 SQL migrations (001-015)
│
├── n8n/
│   └── workflows/           # 10 TypeScript workflow definitions
│       ├── 01-oauth-connect.ts
│       ├── 02-oauth-callback.ts
│       ├── 04-post-crud.ts
│       ├── 05-cron-scheduler.ts
│       ├── 06-facebook-publish.ts
│       ├── 07-instagram-publish.ts
│       ├── 08-token-refresh.ts
│       ├── 09-retry-handler.ts
│       ├── 10-failure-handler.ts
│       └── 11-logging.ts
│
├── docs/
│   ├── META_APP_SETUP.md    # Facebook App creation guide
│   ├── launch-todo.md       # Post-launch checklist
│   └── superpowers/         # Plans and specs
│
├── nginx/                   # nginx config for self-hosted n8n
├── .agents/                 # Agent skill configs
├── .opencode/               # OpenCode IDE config
├── .superpowers/            # Superpowers config
└── graphify-out/            # Knowledge graph output (auto-generated)
```

---

## Data Model

### Tables (9 + 1 config)

```
profiles
├── id (uuid, PK → auth.users)
├── display_name (text, nullable)
├── timezone (text, default 'UTC')
└── created_at, updated_at (triggers)

oauth_state
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── platform (text: 'facebook' | 'instagram')
├── state (text, unique)
├── code_verifier (text, nullable)
├── redirect_url (text, nullable)
├── expires_at (timestamptz)
├── used (boolean, default false)
└── created_at

social_accounts
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── platform (text: 'facebook' | 'instagram')
├── page_id (text)
├── page_name (text, nullable)
├── ig_user_id (text, nullable)
├── ig_username (text, nullable)
├── access_token (text, encrypted via pgp_sym_encrypt)
├── token_expires_at (timestamptz, nullable)
├── status (text: 'active' | 'expired' | 'revoked')
└── created_at, updated_at (triggers)

media_assets
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── file_url (text)
├── file_type (text)
├── file_size (integer, nullable)
├── storage_path (text, nullable)
├── width (integer, nullable)
├── height (integer, nullable)
├── duration (integer, nullable)
└── created_at

scheduled_posts
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── account_id (uuid, nullable, FK → social_accounts)
├── title (text, nullable)
├── caption (text, nullable)
├── platforms (text[], default '{}')
├── schedule_at (timestamptz, nullable)
├── published_at (timestamptz, nullable)
├── timezone (text, default 'UTC')
├── status (text: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled')
├── retry_count (integer, default 0)
├── max_retries (integer, default 3)
├── error_message (text, nullable)
├── created_at, updated_at
└── deleted_at (timestamptz, nullable — soft delete)

post_media (junction)
├── post_id (uuid, FK → scheduled_posts, ON DELETE CASCADE)
├── media_id (uuid, FK → media_assets)
└── sort_order (integer)

post_logs
├── id (uuid, PK)
├── post_id (uuid, FK → scheduled_posts)
├── user_id (uuid)
├── workflow_name (text)
├── status (text: 'success' | 'error' | 'retry')
├── error_message (text, nullable)
├── response_payload (jsonb, nullable)
├── attempt_number (integer)
└── created_at

workflow_runs
├── id (uuid, PK)
├── workflow_name (text)
├── status (text: 'running' | 'success' | 'error')
├── input_payload (jsonb, nullable)
├── output_payload (jsonb, nullable)
├── error_message (text, nullable)
├── duration_ms (integer, nullable)
├── triggered_by (text, nullable)
├── user_id (uuid)
└── created_at

token_refresh_log
├── id (uuid, PK)
├── account_id (uuid, FK → social_accounts)
├── old_expires_at (timestamptz, nullable)
├── new_expires_at (timestamptz, nullable)
├── status (text: 'success' | 'failed')
├── error_message (text, nullable)
└── created_at

app_config (config key-value store)
├── key (text, PK)
├── value (text)
└── description (text, nullable)
```

### Key Relationships

- Every user-scoped table has `user_id` with RLS: `user_id = auth.uid()`
- `scheduled_posts` soft-deletes via `deleted_at` (null = active)
- `post_logs` denormalizes `user_id` for direct RLS without JOIN (migration 010)
- `workflow_runs` denormalizes `user_id` for the same reason

---

## Route Map

| Path | Page | Auth | Layout | Key Components |
|------|------|------|--------|----------------|
| `/` | Landing page | No (anon → dashboard if signed in) | None | HeroSection, FeaturesSection, HowItWorks, StatsBar, Footer |
| `/auth/login` | Login | Redirect to dashboard if signed in | AuthLayout | AuthForm (mode=login) |
| `/auth/register` | Register | Redirect to dashboard if signed in | AuthLayout | AuthForm (mode=register) |
| `/auth/callback` | Post-login redirect | Yes | AuthLayout | — |
| `/dashboard` | Main dashboard | Yes (middleware) | ConsoleShell | StatsRow, PublishingVelocity, UpcomingList, ActivityFeed |
| `/composer` | Create post | Yes (middleware) | ConsoleShell | AccountSelector, CaptionEditor, MediaDropzone, PlatformSelector, SchedulePicker |
| `/composer/[id]` | Edit post | Yes (middleware) | ConsoleShell | Same as composer, pre-filled |
| `/posts` | Post list | Yes (middleware) | ConsoleShell | FilterBar, PostRow |
| `/posts/[id]` | Post detail + logs | Yes (middleware) | ConsoleShell | Post detail with ActivityTimeline |
| `/accounts` | Connected accounts | Yes (middleware) | ConsoleShell | AccountCard, ConnectButton |
| `/accounts/connect` | OAuth callback (API route) | Yes | None | Redirect handler |
| `/calendar` | Calendar view | Yes (middleware) | ConsoleShell | CalendarGrid, DayCell |
| `/media` | Media library | Yes (middleware) | ConsoleShell | MediaGrid |
| `/logs` | Activity logs | Yes (middleware) | ConsoleShell | ActivityTimeline |
| `/settings` | User settings | Yes (middleware) | ConsoleShell | Settings form |
| `/settings/appearance` | Theme settings | Yes (middleware) | ConsoleShell | Appearance form |

Every console route has a co-located `loading.tsx` (skeleton) and `error.tsx` (error display with retry button).

---

## Component Patterns

### Page Structure (Console Pages)

```tsx
'use client'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Page() {
  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible"
                     className="p-4 sm:p-6 space-y-6 max-w-3xl">
          <motion.div variants={item}>
            <h1 className="font-serif text-[28px] text-text tracking-tight">Page Title</h1>
            <p className="text-text-muted text-sm font-sans mt-1">Subtitle</p>
          </motion.div>
          {/* content */}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
```

### Form Validation Pattern (Composer)

Errors computed via `useMemo` from state. Dirty tracking via `Set<string>` — errors only show after field interaction.

```tsx
const [dirty, setDirty] = useState<Set<string>>(new Set())

const errors = useMemo<ValidationErrors>(() => {
  const e: ValidationErrors = {}
  if (!accountId) e.account = 'Select an account'
  // ...
  return e
}, [accountId, /* ... */])

// In JSX:
<Input
  value={title}
  onChange={(e) => { setTitle(e.target.value); setDirty((p) => new Set(p).add('title')) }}
  error={dirty.has('title') ? errors.title : undefined}
/>
<Button disabled={saving || !canSchedule} />
```

### Toast Notifications

Context-based toast system in `components/ui/toast.tsx`. Wrap app root (done in console pages via AuthGuard → ToastProvider is part of ConsoleShell).

```tsx
const { addToast } = useToast()
addToast('Post created', 'success')
addToast('Something went wrong', 'error')
addToast('Post scheduled', 'info')
```

Auto-dismisses after 4 seconds. Styled with gold (info), lime (success), red (error) borders and backgrounds.

### Hook Pattern

```tsx
// hooks/use-X.ts
export function useX() {
  const { user } = useAuth()
  const [data, setData] = useState<XType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('table').select('*').eq('user_id', user.id)
      .then(({ data, error }) => { /* set state */ })
  }, [user])

  return { data, loading, error, reload: () => { /* re-fetch */ } }
}
```

---

## n8n Workflows

All workflows live in `n8n/workflows/` as TypeScript files using `@n8n/workflow-sdk`. They are deployed to n8n Cloud via the n8n MCP server.

| # | Name | Trigger | Auth | Purpose |
|---|------|---------|------|---------|
| 01 | OAuth Connect | POST webhook | JWT (Supabase) | Generate PKCE + Meta OAuth URL |
| 02 | OAuth Callback | POST webhook | JWT (Supabase) | Exchange code, fetch pages, store encrypted |
| 04 | Post CRUD | POST webhook | JWT (Supabase) | Create/edit/cancel posts + link media + log |
| 05 | Cron Scheduler | Cron (5 min) | Internal | Refresh tokens + dispatch pending posts |
| 06 | Facebook Publish | POST webhook | Internal | Post to Facebook via Graph API |
| 07 | Instagram Publish | POST webhook | Internal | Create container → poll → publish |
| 08 | Token Refresh | POST webhook | Internal | Refresh Meta page token |
| 09 | Retry Handler | POST webhook | Internal | Exponential backoff, max 3 retries |
| 10 | Failure Handler | POST webhook | Internal | Log to workflow_runs |
| 11 | Logging | POST webhook | Internal | Centralized workflow_runs insert |

### Auth Model
- **External workflows** (01, 02, 04): First node is `Verify Auth` — validates JWT against Supabase Auth.
- **Internal workflows** (05-11): Authenticated via `x-internal-token` header matched against `INTERNAL_WEBHOOK_SECRET` env var. Verified in each target webhook.
- **Postgres nodes**: All use `service_role` credentials to bypass RLS.

---

## Security Model

| Concern | Mechanism |
|---------|-----------|
| **User isolation** | RLS on all tables: `user_id = auth.uid()` |
| **Token encryption** | AES-256 via `pgp_sym_encrypt()`, key in `app_config` table |
| **Write auth** | Frontend → Next.js API proxy adds JWT → n8n verifies JWT |
| **Internal auth** | `x-internal-token` header shared between n8n workflows |
| **API proxy** | `/api/n8n/[...path]` validates session, adds Bearer token, enforces 10MB body limit |
| **Middleware** | `proxy.ts` redirects unauthenticated users from console routes to `/` |
| **SECURITY DEFINER** | All revoked from anon/authenticated except `get_global_stats()` (intentionally public) |
| **Storage** | `media/` bucket — users can only SELECT their own files (migration 012) |
| **InitPlan** | `auth.uid()` wrapped in `(SELECT auth.uid())` subquery for planner optimization (migration 013) |
| **Concurrency** | Scheduler uses `FOR UPDATE SKIP LOCKED` to prevent double-publishing |

---

## Database Migrations (13 total)

| # | Name | Purpose |
|---|------|---------|
| 001 | `initial_schema` | Core schema: 9 tables, RLS, `updated_at` triggers, encrypt/decrypt functions |
| 002 | `storage_setup` | Create `media` bucket, storage RLS, `get_media_public_url()` |
| 003 | `global_stats_function` | `get_global_stats()` — public landing page stats (published posts, accounts, uptime) |
| 004 | `fix_media_url_function` | Placeholder (superseded by 006) |
| 005 | `set_app_config` | Placeholder (superseded by 006) |
| 006 | `remove_custom_guc_dependency` | `app_config` table, new encrypt/decrypt reading from `app_config` |
| 007 | `encrypt_existing_tokens` | Encrypt existing plaintext tokens in `social_accounts` |
| 008 | `security_remediation` | Key rotation, revoke grants, INSERT RLS policies |
| 009 | `schema_performance_review` | Composite indexes, `post_logs.user_id`, cleanup functions |
| 010 | `workflow_runs_user_id` | Denormalize `user_id` on `workflow_runs`, fix RLS |
| 011 | `revoke_security_definer_anon` | Revoke SECURITY DEFINER from public/anon on all sensitive functions |
| 012 | `storage_select_own_only` | Restrict storage SELECT to own files only |
| 013 | `rls_initplan_optimization` | Wrap `auth.uid()` in subquery for InitPlan optimization |
| 014 | `missing_schema_and_rls_fixes` | Add `refresh_failed` enum, `error_message` on accounts, user_id on token_refresh_log |
| 015 | `add_published_meta_id` | Add `published_meta_id` column to `scheduled_posts` for FB/IG idempotency |

Apply via: `supabase migration up` or `supabase_apply_migration` tool.

---

## Frontend Configuration

### Theme System (Tailwind v4, `globals.css`)

Dark-only palette via `@theme inline {}` block. No light mode.

```
--color-bg:        #0a0a0d    (deepest background)
--color-surface:   #141418    (card/panel)
--color-surface-2: #1d1d26    (elevated surface)
--color-surface-3: #262632    (highest surface)
--color-border:    #2a2a36    (default border)
--color-border-focus: #3a3a4a (focused border)
--color-text:      #f0ece0    (primary text — warm off-white)
--color-text-muted:#928e82    (secondary text)
--color-text-dim:  #5c584e    (tertiary text)
--color-gold:      #c9a84c    (accent, CTA)
--color-wine:      #6b2a38    (alt accent)
--color-steel:     #4a6a7a    (alt accent)
--color-orange:    #d95a20    (warning)
--color-lime:      #8ab82a    (success)
--color-red:       #d9384a    (error)
--color-beige:     #c8b89a    (muted accent)

--font-sans:  'Satoshi' (system-ui fallback)
--font-serif: 'Bilderberg' (Georgia fallback)
--font-mono:  'JetBrains Mono' (SF Mono fallback)
```

### Keyframes available
- `fade-in`, `fade-in-up` — entrance animations
- `slide-left`, `slide-right` — panel transitions
- `scale-in` — modal/popover entrance
- `glow-pulse` — gold accent glow
- `shimmer` — loading skeleton
- `counter` — animated number counters

---

## Sentry Setup

Four config files in `frontend/src/`:

| File | Runtime | Key Config |
|------|---------|------------|
| `instrumentation-client.ts` | Browser | `replayIntegration()`, `browserTracingIntegration()`, `replaysOnErrorSampleRate: 1.0` |
| `sentry.server.config.ts` | Node.js | `includeLocalVariables: true` |
| `sentry.edge.config.ts` | Edge | Minimal, no replays |
| `instrumentation.ts` | Register | Loads server + edge configs based on `NEXT_RUNTIME`, exports `onRequestError` |

`next.config.ts` wraps with `withSentryConfig`: org, project, tunnel route `/monitoring`, source map uploads.

Env vars needed: `NEXT_PUBLIC_SENTRY_DSN` (client), `SENTRY_DSN` (server/edge), `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | n8n Cloud base URL |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL (SEO, canonical) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (client-side) |
| `SENTRY_DSN` | Sentry DSN (server/edge) |
| `SENTRY_ORG` | Sentry org slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Sentry auth token (source maps) |

### n8n Cloud (environment variables in n8n dashboard)

| Variable | Description |
|----------|-------------|
| `FACEBOOK_APP_ID` | Meta App ID |
| `FACEBOOK_APP_SECRET` | Meta App Secret |
| `INTERNAL_WEBHOOK_SECRET` | Shared secret for internal workflow auth |
| `SUPABASE_AUTH_URL` | `https://[project].supabase.co/auth/v1` |
| `FRONTEND_URL` | Frontend URL for OAuth redirects |
| `N8N_WEBHOOK_URL` | Self-referential n8n webhook URL |

---

## Setup

### Development

```bash
# Frontend
cd frontend
cp .env.example .env.local   # Fill in Supabase + n8n URLs
npm install
npm run dev                   # http://localhost:3000

# E2E tests
npx playwright install        # Install browser binaries
npx playwright test           # Run tests

# Build
npm run build                 # Production build
```

### n8n Cloud Setup

1. Create n8n cloud account at `aman01.app.n8n.cloud`
2. Set environment variables in n8n Dashboard → Environment Variables
3. Create Supabase DB credential (service_role connection string)
4. Deploy each workflow via the n8n MCP server (`create_workflow_from_code`)

### Docker Self-Hosted

```bash
docker compose up -d   # n8n + nginx + certbot
```

Configured in `docker-compose.yml` with Let's Encrypt SSL.

---

## Meta App Setup

See `docs/META_APP_SETUP.md` for the full step-by-step guide. Summary:

1. Create Facebook App at developers.facebook.com (Business type)
2. Add Facebook Login product (OAuth redirect: `https://n8n-url/webhook/oauth-callback`)
3. Add Instagram Basic Display / Graph API (pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish)
4. Copy App ID + Secret to n8n env vars

---

## Graphify Knowledge Graph

This project uses Graphify for codebase exploration. After changes, refresh:

```bash
graphify update .
```

Query the graph:

```bash
graphify query "How does OAuth work?"
graphify path "supabase/migrations/001_initial_schema.sql" "n8n/workflows/02-oauth-callback.ts"
graphify explain "token encryption"
```

Graph data lives in `graphify-out/graph.json`. Use for answering codebase questions instead of raw grep.

---

## Deployment

**Frontend:** Push to GitHub → Vercel auto-deploys (connected to `multi-user-social-media-scheduler-s.vercel.app`).

**n8n Workflows:** Deployed via n8n MCP server (`create_workflow_from_code`). All 10 workflows are active.

**Supabase Migrations:** Apply via Supabase CLI or `supabase_apply_migration` tool. Always apply in order 001-013.

---

## Key Files Reference

| File | What it does |
|------|-------------|
| `frontend/src/proxy.ts` | Middleware: auth guard + route redirection |
| `frontend/src/lib/supabase.ts` | Browser Supabase client singleton |
| `frontend/src/lib/n8n.ts` | n8n webhook client (connectOAuth, createPost, updatePost, cancelPost) |
| `frontend/src/lib/queries.ts` | Supabase query helpers (getMyPosts, getMyAccounts, etc.) |
| `frontend/src/types/database.ts` | All TypeScript interfaces (SocialAccount, ScheduledPost, etc.) |
| `frontend/src/app/api/n8n/[...path]/route.ts` | JWT-authed proxy to n8n |
| `frontend/src/components/ui/toast.tsx` | Toast notification context + provider |
| `n8n/workflows/05-cron-scheduler.ts` | Scheduler: polls every 5 min, dispatches posts |
| `n8n/workflows/06-facebook-publish.ts` | Facebook Graph API publisher |
| `n8n/workflows/07-instagram-publish.ts` | Instagram container + poll + publish |
| `docs/META_APP_SETUP.md` | Meta App creation guide |
| `frontend/docs/USER_GUIDE.md` | End-user instructions |
| `frontend/docs/UP_TIME_MONITORING.md` | Monitoring recommendations |

---

## Known Constraints

- **Meta App:** Must be created manually by the user (no API for app creation)
- **n8n Cloud env vars:** Must be set manually in n8n dashboard
- **No pricing/billing:** Stripe, pricing page, usage limits intentionally skipped
- **Dark mode only:** No light theme (palette in `globals.css`)
- **Leaked password protection:** Requires Supabase Dashboard UI (ALTER SYSTEM restricted on managed Postgres)
