# Hero Section Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the landing page hero with improved typography, a floating login button, wired auth flow fixes.

**Architecture:** All changes are within 4 existing files in `frontend/`. No new components, no new dependencies. The floating login button is a lightweight `LandingShell` wrapper in `page.tsx`. Auth wiring fixes are surgical edits to the login page and AuthGuard.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, Framer Motion, Supabase Auth

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `frontend/src/components/landing/hero-section.tsx` | Hero typography, nav links, animation config | Typography rewrite, `<a>` → `<Link>`, opacity fix |
| `frontend/src/app/page.tsx` | Landing page composition + shared shell | Add `LandingShell` wrapper with floating login button |
| `frontend/src/app/auth/login/page.tsx` | Login form + verified banner | Handle `?verified=1` with Suspense boundary |
| `frontend/src/components/auth/auth-guard.tsx` | Redirect unauthenticated users | Change redirect target to `/` |

---

### Task 1: Fix hero opacity bug and replace `<a>` with `<Link>`

**Files:**
- Modify: `frontend/src/components/landing/hero-section.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat frontend/src/components/landing/hero-section.tsx
```

- [ ] **Step 2: Fix container variant and add Link import**

Changes:
1. Add `import Link from 'next/link'`
2. Change container `visible` to include `opacity: 1`
3. Replace `<a href="/auth/register">` with `<Link href="/auth/register">`
4. Replace `<a href="/auth/login">` with `<Link href="/auth/login">`

```tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { TopographicLines } from './topographic-lines'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
}
```

Find the two `<a>` tags and replace:

```tsx
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center h-12 px-8 rounded-sm bg-gold text-bg font-sans text-sm font-medium tracking-wide hover:bg-gold/90 active:bg-gold-dim transition-colors border border-gold/30"
          >
            Get Started
          </Link>
```

```tsx
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center h-12 px-8 rounded-sm bg-transparent text-text-muted font-sans text-sm font-medium tracking-wide hover:text-text hover:bg-surface-2 transition-colors border border-border"
          >
            Sign In
          </Link>
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: No errors. Build succeeds.

---

### Task 2: Hero typography — value-prop headline

**Files:**
- Modify: `frontend/src/components/landing/hero-section.tsx`

- [ ] **Step 1: Replace the hero heading and brand sign-off**

Find this block:
```tsx
        <motion.h1
          variants={item}
          className="font-serif text-[56px] sm:text-[72px] md:text-[88px] text-text tracking-tight leading-[0.95]"
        >
          Console
        </motion.h1>
```

Replace with:
```tsx
        <motion.h1
          variants={item}
          className="font-serif text-[56px] sm:text-[72px] md:text-[80px] text-text tracking-tight leading-[0.95]"
        >
          Orchestrate Your Content.
        </motion.h1>
        <motion.p
          variants={item}
          className="font-serif text-[56px] sm:text-[72px] md:text-[80px] text-text tracking-tight leading-[0.95] -mt-2 sm:-mt-3"
        >
          Amplify Your Reach.
        </motion.p>

        <motion.p
          variants={item}
          className="mt-4 font-serif text-[24px] sm:text-[28px] tracking-[0.15em] text-text-muted"
        >
          Console
        </motion.p>
```

The existing subtitle paragraph stays unchanged.

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

---

### Task 3: Floating login button on landing page

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Read current page.tsx**

```bash
cat frontend/src/app/page.tsx
```

- [ ] **Step 2: Create LandingShell wrapper with floating button**

The floating button wraps all landing sections. It renders as a fragment with a fixed-position "Sign In" link and the children. On `/auth/login` and `/auth/register`, it checks the pathname and hides itself.

```tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorks } from '@/components/landing/how-it-works'
import { StatsBar } from '@/components/landing/stats-bar'
import { Footer } from '@/components/landing/footer'

function LandingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/auth/login' || pathname === '/auth/register'

  return (
    <>
      {!isAuthPage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="fixed top-6 right-6 z-50"
        >
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center h-9 px-4 rounded-sm bg-transparent border border-gold/40 text-gold font-mono text-[11px] uppercase tracking-widest hover:bg-gold/10 transition-colors"
          >
            Sign In
          </Link>
        </motion.div>
      )}
      {children}
    </>
  )
}

export default function LandingPage() {
  return (
    <LandingShell>
      <HeroSection />
      <FeaturesSection />
      <StatsBar />
      <HowItWorks />
      <Footer />
    </LandingShell>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

---

### Task 4: Handle `?verified=1` on login page

**Files:**
- Modify: `frontend/src/app/auth/login/page.tsx`

- [ ] **Step 1: Read current login page**

```bash
cat frontend/src/app/auth/login/page.tsx
```

- [ ] **Step 2: Rewrite login page with Suspense and verified banner**

The page needs `useSearchParams()` wrapped in a `<Suspense>` boundary per Next.js conventions. The verified banner shows gold text with a close button.

```tsx
'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/auth-layout'
import { AuthForm } from '@/components/auth/auth-form'
import { useAuth } from '@/hooks/use-auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const [showVerified, setShowVerified] = useState(searchParams.get('verified') === '1')

  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password)
    if (error) throw error
    router.push('/dashboard')
  }

  return (
    <AuthLayout>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          {showVerified && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-gold/10 border border-gold/30 text-gold text-[12px] font-mono p-3 rounded-sm pr-8"
            >
              Account created! Check your email to verify, then sign in below.
              <button
                onClick={() => setShowVerified(false)}
                className="absolute top-2 right-2 text-gold/60 hover:text-gold text-xs leading-none"
              >
                ×
              </button>
            </motion.div>
          )}
          <AuthForm mode="login" onSubmit={handleLogin} />
        </div>
      </div>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

---

### Task 5: AuthGuard redirect to landing page

**Files:**
- Modify: `frontend/src/components/auth/auth-guard.tsx`

- [ ] **Step 1: Read current auth-guard.tsx**

```bash
cat frontend/src/components/auth/auth-guard.tsx
```

- [ ] **Step 2: Change redirect target**

Find:
```tsx
      router.push('/auth/login')
```

Replace with:
```tsx
      router.push('/')
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

---

### Task 6: Full build verification

- [ ] **Step 1: Run full build**

```bash
cd frontend && npm run build 2>&1
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Manual checks**

- Open landing page → hero shows "Orchestrate Your Content. / Amplify Your Reach." with "Console" sign-off below
- Floating "Sign In" button visible in top-right corner
- Click floating "Sign In" → navigates to `/auth/login` client-side (no full reload)
- Navigate to `/auth/login?verified=1` → gold banner appears at top
- Click × on banner → banner dismisses
- Visit `/auth/register` → floating button is hidden
- AuthGuard redirects to `/` instead of `/auth/login`
- Hero buttons ("Get Started", "Sign In") navigate client-side
