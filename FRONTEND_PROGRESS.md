# Frontend Progress — Console Social Media Scheduler

> **Status: ✅ Frontend scaffold complete.** All 15 routes, all components, all hooks, all libraries built.
> Remaining: Wire to live n8n backend (OAuth workflows, cron scheduler), deploy.

## Routes (15/15 complete)

| Route | Status |
|-------|--------|
| `/` Landing page | ✅ Built |
| `/auth/login` | ✅ Built |
| `/auth/register` | ✅ Built |
| `/auth/callback` | ✅ Built |
| `/auth/forgot-password` | ✅ Built |
| `/auth/reset-password` | ✅ Built |
| `/dashboard` | ✅ Built |
| `/composer` | ✅ Built |
| `/composer/[id]` | ✅ Built |
| `/calendar` | ✅ Built |
| `/posts` | ✅ Built |
| `/posts/[id]` | ✅ Built |
| `/accounts` | ✅ Built |
| `/media` | ✅ Built |
| `/logs` | ✅ Built |
| `/settings` | ✅ Built |
| `/settings/appearance` | ✅ Built |
| `/settings/billing` | ✅ Built |
| `/onboarding` | ✅ Built |

## Components (all built)

| Area | Components |
|------|-----------|
| Shell | ConsoleShell, LeftNav, TopBar, StatusBar |
| Auth | AuthForm, AuthGuard, AuthLayout, MotionNarrative |
| Dashboard | StatsRow, PublishingVelocity, UpcomingList, ActivityFeed |
| Composer | AccountSelector, CaptionEditor, MediaDropzone, PlatformSelector, SchedulePicker |
| Calendar | CalendarGrid, DayCell |
| Posts | FilterBar, PostRow |
| Media | MediaGrid |
| Accounts | AccountCard, ConnectButton |
| Logs | ActivityTimeline |
| Shell | ConsoleShell, LeftNav, TopBar, StatusBar |
| UI | Button, Input, Badge, Skeleton, Toast, ErrorBoundary |
| Landing | HeroSection, FeaturesSection, HowItWorks, StatsBar, Footer, FloatingSignIn, TopographicLines, CtaSection, TestimonialsSection |
| Providers | PageTransition, SmoothScroll |

## Hooks (7/7 complete)

- use-auth, use-accounts, use-dashboard, use-calendar, use-media, use-posts, use-settings

## Library

- supabase.ts (browser + server clients), n8n.ts (webhook client), queries.ts (DB queries)

## Backend Dependencies

- [ ] Deploy n8n OAuth Connect workflow (01)
- [ ] Deploy n8n OAuth Callback workflow (02)
- [ ] Deploy n8n Post CRUD workflow (04)
- [ ] Deploy n8n Cron Scheduler workflow (05) / pg_cron setup
- [ ] Deploy n8n Facebook Publish workflow (06)
- [ ] Deploy n8n Instagram Publish workflow (07)
- [ ] Deploy n8n Token Refresh workflow (08)
- [ ] Deploy n8n Retry Handler workflow (09)
- [ ] Deploy n8n Failure Handler workflow (10)
- [ ] Deploy n8n Logging workflow (11)
- [ ] Apply all Supabase migrations (001-029+)
- [ ] Create Meta App and configure credentials
