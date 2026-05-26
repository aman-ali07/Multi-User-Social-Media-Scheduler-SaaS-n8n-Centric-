# Phase 6 — Next.js Frontend Plan

## Design Direction: **"Signal"**

A warm-dark interface inspired by broadcast control rooms and analog recording studio equipment. Not another dark-mode SaaS with purple gradients — this evokes the feeling of a physical mixing console: warm amber meters, signal-red indicators, tactile controls, and deliberate analog warmth.

### Design Tokens

| Token | Value | Context |
|-------|-------|---------|
| `--bg` | `#0f0f15` | Deepest layer, main background |
| `--surface` | `#1c1c24` | Cards, panels, dropdowns |
| `--surface-2` | `#262632` | Hover states, elevated elements |
| `--surface-3` | `#303040` | Active states, pressed |
| `--border` | `#2e2e3a` | Subtle borders, dividers |
| `--text` | `#e8e4dc` | Warm off-white body text |
| `--text-muted` | `#8a86a0` | Secondary/tertiary text |
| `--accent` | `#d4a74d` | Amber/gold — primary interactive |
| `--accent-dim` | `#a07830` | Muted accent (disabled) |
| `--red` | `#d9384a` | Signal red — errors, destructive |
| `--red-dim` | `#8a2020` | Muted error background |
| `--green` | `#2a9d8f` | Teal — success, published |
| `--green-dim` | `#1a5c54` | Muted success background |

**Typography:**
- Headings: `Playfair Display` — editorial serif, distinctive shape, not overused in SaaS
- Body: `DM Sans` — geometric, warm, underused alternative to Inter/Roboto
- Monospace: `JetBrains Mono` — dates, post IDs, status badges
- Scale: 12 / 14 / 16 / 20 / 24 / 32 / 48

**Tone:**
- Deliberately dark with warm undertones (avoid pure #000)
- High emphasis on negative space — every element breathes
- Subtle analog textures: faint noise overlay on heavy surfaces, soft glow on active elements
- No rounded corners everywhere — mix of sharp and slightly rounded (4px) based on hierarchy
- No generic shadows — use colored glows instead (e.g., amber glow on focus, red glow on errors)

---

## Pages & Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Redirect to `/dashboard` | — |
| `/auth/login` | Login | Supabase Auth sign-in |
| `/auth/register` | Register | Supabase Auth sign-up |
| `/auth/callback` | Callback | Token exchange (Supabase handles) |
| `/dashboard` | Dashboard | Overview: upcoming posts, quick stats, activity feed |
| `/composer` | New Post | Full post composer: caption, media, platform, schedule |
| `/composer/[id]` | Edit Post | Load existing draft/scheduled post |
| `/calendar` | Calendar | Month/week calendar of scheduled posts |
| `/posts` | Posts | Filterable list: all posts (drafts/scheduled/published/failed) |
| `/posts/[id]` | Post Detail | Single post view + history/logs |
| `/accounts` | Accounts | Connected Facebook/Instagram accounts |
| `/accounts/connect` | Connect | OAuth flow initiation |
| `/media` | Media Library | All uploaded media with grid view |
| `/logs` | Activity Log | post_logs + workflow_runs timeline |
| `/settings` | Settings | Profile, timezone, preferences |
| `/settings/appearance` | Appearance | Theme customization |

---

## Component Tree

```
<RootLayout>                          — app/layout.tsx
  <AuthGuard>                         — redirect to /auth if unauthenticated
    <AppShell>                         — sidebar + topbar + content
      <Sidebar>                        — nav links, account switcher
        <SidebarNav />
        <SidebarFooter />             — user menu
      </Sidebar>
      <main>
        {children}                    — page content
      </main>
    </AppShell>
  </AuthGuard>
</RootLayout>
```

### Sidebar

```
<Sidebar>
  <Logo />                            — app logo + name
  <SidebarNav>
    <NavItem icon="grid"    href="/dashboard">  Dashboard
    <NavItem icon="pen"     href="/composer">   Compose
    <NavItem icon="calendar" href="/calendar">  Calendar
    <NavItem icon="list"    href="/posts">      Posts
    <NavItem icon="layers"  href="/media">      Media
    <NavItem icon="users"   href="/accounts">   Accounts
    <NavItem icon="activity" href="/logs">      Activity
  </SidebarNav>
  <SidebarFooter>
    <UserMenu />
    <SettingsLink href="/settings" />
  </SidebarFooter>
</Sidebar>
```

### Dashboard Page Components

```
<DashboardPage>
  <PageHeading title="Dashboard" subtitle="Today's broadcast schedule" />
  <StatsRow>
    <StatCard label="Scheduled Today" value="4" />
    <StatCard label="Published" value="127" />
    <StatCard label="Failed" value="3" trend="down" />
    <StatCard label="Connected Accounts" value="3" />
  </StatsRow>
  <section>
    <SectionHeading title="Upcoming Posts" />
    <UpcomingList>
      <PostCard />     — mini card: time, caption preview, platform badge, status
      <PostCard />
    </UpcomingList>
  </section>
  <section>
    <SectionHeading title="Recent Activity" />
    <ActivityFeed>
      <ActivityItem />  — icon + message + timestamp
      <ActivityItem />
    </ActivityFeed>
  </section>
</DashboardPage>
```

### Composer Page Components

```
<ComposerPage>
  <PageHeading title="Compose Post" />
  <ComposerLayout>
    <ComposerMain>
      <MediaDropzone />           — drag/drop or click to upload
      <MediaPreview />            — thumbnail grid of selected media
      <CaptionEditor />           — rich text area with char count
      <MentionInput />            — @mention and #hashtag suggestions (future)
    </ComposerMain>
    <ComposerSidebar>
      <PlatformSelector />        — toggle platforms with account picker
      <SchedulePicker />          — date/time picker with timezone
      <StatusBadge />             — draft vs scheduled toggle
      <ActionButtons>
        <Button variant="secondary">Save Draft</Button>
        <Button variant="primary">Schedule</Button>
      </ActionButtons>
    </ComposerSidebar>
  </ComposerLayout>
</ComposerPage>
```

### Calendar Page Components

```
<CalendarPage>
  <PageHeading title="Schedule" />
  <CalendarToolbar>
    <ViewToggle views={["month", "week"]} />
    <MonthNav />                  — prev/next + current month label
    <TodayButton />
  </CalendarToolbar>
  <CalendarGrid>
    <DayCell>
      <DayNumber />
      <PostIndicator />           — small dots showing post count
    </DayCell>
    <DayCell>
      <DayNumber />
      <PostIndicator />
    </DayCell>
  </CalendarGrid>
</CalendarPage>
```

### Posts List Page

```
<PostsPage>
  <PageHeading title="Posts" />
  <FilterBar>
    <SearchInput />
    <StatusFilter tabs={["all", "draft", "scheduled", "published", "failed"]} />
    <PlatformFilter />
    <DateRangeFilter />
  </FilterBar>
  <PostsTable>
    <PostRow />                   — title, platforms, status, schedule time, actions
    <PostRow />
  </PostsTable>
  <Pagination />
</PostsPage>
```

### Accounts Page

```
<AccountsPage>
  <PageHeading title="Connected Accounts" />
  <ActionBar>
    <ConnectButton platform="facebook" />
    <ConnectButton platform="instagram" disabled />  — linked via FB
  </ActionBar>
  <AccountsGrid>
    <AccountCard>
      <PlatformIcon />
      <AccountMeta />             — page name, IG username
      <StatusBadge />             — active/expired
      <TokenHealth />             — days until token expiry
      <AccountActions>
        <RefreshButton />
        <DisconnectButton />
      </AccountActions>
    </AccountCard>
  </AccountsGrid>
</AccountsPage>
```

---

## API Integration Layer

Frontend calls n8n webhooks directly. No Next.js API routes — n8n IS the backend.

```typescript
// src/lib/n8n.ts — API client
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
const SESSION = useSupabaseSession(); // from hook

async function callWebhook(path: string, body?: object) {
  const session = await getSession();
  return fetch(`${N8N_WEBHOOK_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Auth — Direct Supabase client (doesn't go through n8n)
const supabase = createBrowserClient();

// Post CRUD
const postsApi = {
  create: (data: CreatePostData) => callWebhook('/webhook/post', { operation: 'create', ...data }),
  update: (data: UpdatePostData) => callWebhook('/webhook/post', { operation: 'update', ...data }),
  cancel: (postId: string) => callWebhook('/webhook/post', { operation: 'cancel', postId }),
  list: (filters: PostFilters) => callWebhook('/webhook/post', { operation: 'list', ...filters }),
  get: (postId: string) => callWebhook('/webhook/post', { operation: 'get', postId }),
};

// OAuth
const oauthApi = {
  connect: (userId: string) => callWebhook('/webhook/oauth-connect', { userId, platform: 'facebook' }),
  // Callback is GET, browser handles the redirect
};

// Media
const mediaApi = {
  upload: (file: File, userId: string) => {
    // Upload to Supabase Storage directly (presigned URL)
    // Then call n8n to register in media_assets
  },
  list: (userId: string) => callWebhook('/webhook/media-upload', { operation: 'list', userId }),
};

// Logs
const logsApi = {
  list: (filters: LogFilters) => fetch(`${N8N_WEBHOOK_URL}/webhook/logs?${toQuery(filters)}`),
};
```

### Supabase Direct Access Pattern

Some operations go direct to Supabase (bypassing n8n):
- **Auth:** Supabase Auth client (sign in, sign up, session)
- **Storage uploads:** Direct to Supabase Storage (presigned URLs)
- **Read queries:** RLS-protected direct queries for lists (faster than webhook round-trip)

n8n handles:
- **All writes** (CRUD on posts, media_assets registration)
- **OAuth flow**
- **Scheduling + publishing**
- **Token management**

---

## Data Models (TypeScript)

```typescript
// src/types/database.ts
type Platform = 'facebook' | 'instagram';
type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
type AccountStatus = 'active' | 'expired' | 'revoked';

interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface SocialAccount {
  id: string;
  user_id: string;
  platform: Platform;
  page_id: string;
  page_name: string | null;
  ig_user_id: string | null;
  ig_username: string | null;
  // No access_token exposed to frontend
  token_expires_at: string | null;
  status: AccountStatus;
  created_at: string;
}

interface MediaAsset {
  id: string;
  user_id: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  storage_path: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  created_at: string;
}

interface ScheduledPost {
  id: string;
  user_id: string;
  account_id: string | null;
  title: string | null;
  caption: string | null;
  media_ids: string[];
  platforms: Platform[];
  schedule_at: string | null;
  published_at: string | null;
  timezone: string;
  status: PostStatus;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Joined from junction table
  media?: MediaAsset[];
  logs?: PostLog[];
}

interface PostLog {
  id: string;
  post_id: string;
  workflow_name: string;
  status: string;
  error_message: string | null;
  response_payload: unknown;
  attempt_number: number;
  created_at: string;
}
```

---

## Supabase Direct Queries (RLS-protected, frontend-safe)

```typescript
// src/lib/supabase-queries.ts
// These read directly from Supabase (RLS restricts to own data)
// n8n handles writes via webhooks

const supabase = createBrowserClient();

export async function getMyPosts(filters: {
  status?: PostStatus;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('scheduled_posts')
    .select('*, media:post_media(media_id, sort_order, media:media_assets(*))')
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.limit) query = query.limit(filters.limit);
  if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20));

  return query;
}

export async function getUpcomingPosts(limit = 5) {
  return supabase
    .from('scheduled_posts')
    .select('*, media:post_media(media_id, sort_order, media:media_assets(*))')
    .eq('status', 'scheduled')
    .gte('schedule_at', new Date().toISOString())
    .order('schedule_at', { ascending: true })
    .limit(limit);
}

export async function getCalendarPosts(from: string, to: string) {
  return supabase
    .from('scheduled_posts')
    .select('id, title, status, platforms, schedule_at, published_at')
    .in('status', ['scheduled', 'published'])
    .gte('schedule_at', from)
    .lte('schedule_at', to);
}

export async function getMyAccounts() {
  return supabase
    .from('social_accounts')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function getMyMedia() {
  return supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function getLogsForPost(postId: string) {
  return supabase
    .from('post_logs')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
}
```

---

## Implementation Order

### Phase 6a — Scaffold & Auth
1. `npx create-next-app frontend` with App Router + TypeScript + Tailwind
2. Set up Supabase Auth client
3. Auth pages: `/auth/login`, `/auth/register`
4. Auth guard middleware (redirect if no session)
5. Basic `AppShell` with placeholder sidebar and content area
6. Design system: CSS variables, utility classes, base styles

### Phase 6b — Navigation & Layout
7. `Sidebar` component with all nav links
8. `TopBar` with user menu
9. Responsive: mobile sidebar as drawer
10. Loading states (skeleton screens)
11. Error boundaries per page

### Phase 6c — Data Layer
12. Supabase client setup + RLS queries
13. n8n webhook client (`src/lib/n8n.ts`)
14. React Query / SWR setup for data fetching
15. Auth context: session, profile, token refresh

### Phase 6d — Core Pages
16. **Dashboard** — stats row, upcoming posts, activity feed
17. **Posts List** — filterable table, search, status tabs
18. **Composer** — media dropzone, caption editor, platform selector, schedule picker
19. **Calendar** — month grid with post indicators, click to view day details
20. **Post Detail** — full view with log timeline

### Phase 6e — Management Pages
21. **Accounts** — connected accounts grid, connect/disconnect flow
22. **Media Library** — grid view, upload button, file type filters
23. **Activity Log** — timeline of all post_logs and workflow_runs
24. **Settings** — profile, timezone, preferences

### Phase 6f — Polish
25. Responsive design pass
26. Dark/light mode toggle (add warm light mode)
27. Keyboard shortcuts
28. Empty states, error states, loading skeletons for every page
29. Post-scheduling confirmation and feedback

---

## Directory Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── og-image.png          — social card
├── src/
│   ├── app/
│   │   ├── layout.tsx        — root layout (fonts, providers)
│   │   ├── page.tsx          — redirect to /dashboard
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── callback/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── composer/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── posts/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── accounts/
│   │   │   ├── page.tsx
│   │   │   └── connect/route.ts
│   │   ├── media/page.tsx
│   │   ├── logs/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── appearance/page.tsx
│   ├── components/
│   │   ├── ui/               — primitive: Button, Input, Select, Dialog, etc.
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── SidebarNav.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsRow.tsx
│   │   │   ├── UpcomingList.tsx
│   │   │   └── ActivityFeed.tsx
│   │   ├── posts/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostRow.tsx
│   │   │   └── PostStatusBadge.tsx
│   │   ├── composer/
│   │   │   ├── MediaDropzone.tsx
│   │   │   ├── CaptionEditor.tsx
│   │   │   ├── PlatformSelector.tsx
│   │   │   └── SchedulePicker.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarGrid.tsx
│   │   │   └── DayCell.tsx
│   │   ├── accounts/
│   │   │   ├── AccountCard.tsx
│   │   │   └── ConnectButton.tsx
│   │   └── media/
│   │       └── MediaGrid.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePosts.ts
│   │   ├── useCalendar.ts
│   │   ├── useAccounts.ts
│   │   ├── useMedia.ts
│   │   └── useKeyboard.ts
│   ├── lib/
│   │   ├── supabase.ts       — Supabase client
│   │   ├── n8n.ts            — Webhook API client
│   │   ├── queries.ts        — Supabase direct queries
│   │   └── utils.ts          — formatDate, cn, etc.
│   └── types/
│       └── database.ts
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── package.json
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Direct Supabase reads (RLS) | Faster than round-tripping through n8n for every list query; RLS ensures security |
| n8n for all writes | n8n handles validation, business logic, and side effects (like triggering publish) |
| No Next.js API routes | n8n IS the API layer — adding Next.js API routes would duplicate n8n's role |
| Supabase client-side auth | Standard Supabase Auth pattern; n8n receives session token in webhook calls for identity |
| Tailwind CSS | Scoped styles, rapid iteration, pairs well with the custom design system |
| React Query | Cache management, dedup, optimistic updates, stale-while-revalidate for calendars |
| No shadcn/ui | Most component library defaults are the generic look the user wants to avoid. Building custom UI components ensures distinctiveness |
| Post page as both draft + scheduled editor | Single route handles both creation and editing — simplifies state management |

---

## n8n Webhook Contract Map

| Frontend Action | n8n Endpoint | Method |
|---|---|---|
| Create post | `POST /webhook/post` (op: create) | Behind-the-scenes |
| Update post | `POST /webhook/post` (op: update) | Behind-the-scenes |
| Cancel post | `POST /webhook/post` (op: cancel) | Behind-the-scenes |
| Connect account | `POST /webhook/oauth-connect` | Returns redirect URL |
| OAuth callback | `GET /webhook/oauth-callback` | Browser redirect |
| Register media | `POST /webhook/media-upload` | After storage upload |
| All list queries | Direct Supabase (RLS) | No n8n needed |
| Dashboard stats | Direct Supabase (RLS) | Aggregate queries |

---

## Next Step

Create the Next.js app scaffold with `create-next-app`, set up the design system CSS variables, build the `AppShell` layout, `AuthGuard`, and login/register pages.
