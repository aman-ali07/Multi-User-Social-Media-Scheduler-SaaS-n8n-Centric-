# Hero Section Redesign — Design Spec

## Overview

Redesign the landing page hero section with improved typography, a persistent floating login button, and fixes to the auth flow wiring. All changes are in the existing `frontend/` directory — no new files, no new dependencies.

## Files Changed

| File | Changes |
|------|---------|
| `frontend/src/components/landing/hero-section.tsx` | Typography overhaul, `<a>` → `<Link>`, opacity bug fix |
| `frontend/src/app/page.tsx` | Add floating login button wrapper for all landing sections |
| `frontend/src/app/auth/login/page.tsx` | Handle `?verified=1` param with Suspense boundary |
| `frontend/src/components/auth/auth-guard.tsx` | Redirect to `/` instead of `/auth/login` |

## 1. Hero Typography

### Current State
- Heading: "Console" (serif, 88px) — brand name only, no value proposition
- Subtitle: "Schedule, publish, and monitor social content..." (sans, 18px)
- Version badge: "v0.1 — Content Orchestration Platform" (mono, 10px)

### Target State (Option 1)
The hero leads with a value-prop headline, with "Console" as a smaller brand sign-off:

```
[v0.1 — Content Orchestration Platform]     ← badge, unchanged

Orchestrate Your Content.                    ← serif, ~72px (Bilderberg)
Amplify Your Reach.                          ← serif, ~72px (Bilderberg)

Console                                      ← serif, ~32px, tracking-wider, text-muted

Schedule, publish, and monitor social content across Facebook
and Instagram — from one console.           ← sans, 18px (Satoshi)
```

Specifics:
- First two lines: `font-serif text-[56px] sm:text-[72px] md:text-[80px] text-text tracking-tight leading-[0.95]`
- "Console" brand sign-off: `font-serif text-[28px] tracking-[0.15em] text-text-muted`
- All animated via existing Framer Motion stagger (unchanged)
- The scroll indicator at the bottom stays as-is

## 2. Floating Login Button

A persistent login button visible across all landing sections. No navbar.

- Position: `fixed top-6 right-6 z-50`
- Size: `h-9 px-4 text-[11px]`
- Style: `bg-transparent border border-gold/40 text-gold font-mono uppercase tracking-widest`
- Hover: `hover:bg-gold/10`
- Animation: Framer Motion fade-in on mount
- Renders as a Next.js `<Link href="/auth/login">`
- Auto-hides when the current route is `/auth/login` or `/auth/register`
- Implemented as a `LandingShell` wrapper component in `page.tsx`, not as a separate file

## 3. Opacity Bug Fix

The hero container animation has:
```
visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } }
```
Missing `opacity: 1` — the container stays at `opacity: 0` permanently. Items animate in (stagger fires) but are invisible because the parent is transparent.

Fix: Add `opacity: 1` to the visible variant.

## 4. Hero `<a>` → `<Link>`

Replace `<a>` tags with Next.js `<Link>` for "Get Started" and "Sign In" in the hero. Enables client-side navigation instead of full page reloads. All CSS classes stay identical.

## 5. `?verified=1` Handling on Login Page

After registration, `signUp()` pushes to `/auth/login?verified=1`. The login page currently ignores this query param.

- Import `useSearchParams` from `next/navigation` and wrap in `<Suspense>` boundary
- If `verified=1`, render a gold-tinted banner above the login form:
  - "Account created! Check your email to verify, then sign in below."
  - Style: `bg-gold/10 border border-gold/30 text-gold text-[12px] font-mono p-3 rounded-sm`
- Banner has a small "×" close button in the top-right corner
- Banner also auto-clears when the user focuses on an input field or submits the form

## 6. AuthGuard Redirect

Change `router.push('/auth/login')` → `router.push('/')` so unauthenticated users see the landing page (with product pitch) instead of going straight to the login form.

## Error Handling

- Login form error display is unchanged (existing `<motion.p>` red error text)
- AuthGuard loading state is unchanged
- `?verified=1` param parsing is wrapped in Suspense per Next.js requirements
- Floating button has no data dependencies — it's presentational only

## Testing

- Build: `npm run build` in `frontend/` must pass
- Manual: Verify hero text renders with correct typography
- Manual: Verify floating login button appears on landing and hides on auth pages
- Manual: Verify `?verified=1` banner shows on login page after registration redirect
- Manual: Verify AuthGuard redirects to `/` instead of `/auth/login`
- Manual: Confirm `<Link>` navigation works without full page reloads
