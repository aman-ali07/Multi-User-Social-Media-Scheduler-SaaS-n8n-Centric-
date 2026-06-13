'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit: (email: string, password: string) => Promise<void>
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }}
      className="flex-1 flex items-center justify-center p-4 sm:p-8"
    >
      <div className="w-full max-w-xs sm:max-w-sm space-y-8">
        <div className="space-y-2">
          <h1 className="font-cal text-[32px] text-ink tracking-tighter leading-none">
            {mode === 'login' ? 'Welcome back' : 'Join Console'}
          </h1>
          <p className="text-muted text-[15px] font-medium">
            {mode === 'login'
              ? 'Sign in to your content operations console.'
              : 'Create your account to start orchestrating.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="name@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="············"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {mode === 'login' && (
            <div className="flex justify-end -mt-2">
              <Link href="/auth/forgot-password" className="text-[12px] text-muted hover:text-ink transition-colors font-medium">
                Forgot password?
              </Link>
            </div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-error text-[12px] font-medium"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full h-11 text-[14px]"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-canvas/30 border-t-canvas rounded-full animate-spin" />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hairline" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-canvas px-2 text-muted font-bold tracking-widest">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="lg"
          className="w-full h-11 text-[14px]"
          disabled
        >
          <span className="flex items-center gap-2 font-semibold">
            <span className="text-[16px] text-[#1877F2]">f</span>
            Meta Business Account
          </span>
        </Button>

        <p className="text-center text-[13px] text-muted font-medium">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-ink hover:underline transition-all font-semibold">
                Register
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link href="/auth/login" className="text-ink hover:underline transition-all font-semibold">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </motion.div>
  )
}
