'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
    } catch (err: any) {
      setError(err?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }}
      className="flex-1 flex items-center justify-center p-8"
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-[28px] text-text tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Join Console'}
          </h1>
          <p className="text-text-muted text-sm font-sans">
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

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red text-[12px] font-mono"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-bg/30 border-t-bg rounded-full animate-spin" />
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
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-text-dim font-mono tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="gold"
          size="lg"
          className="w-full"
          disabled
        >
          <span className="flex items-center gap-2">
            <span className="text-sm">◈</span>
            Meta Business Account
          </span>
        </Button>

        <p className="text-center text-[12px] text-text-dim font-sans">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <a href="/auth/register" className="text-gold hover:text-gold/80 transition-colors">
                Register
              </a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a href="/auth/login" className="text-gold hover:text-gold/80 transition-colors">
                Sign in
              </a>
            </>
          )}
        </p>
      </div>
    </motion.div>
  )
}
