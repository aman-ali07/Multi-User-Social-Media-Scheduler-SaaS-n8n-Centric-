'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { resetPassword, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error: resetError } = await resetPassword(email)
    if (!resetError) setSuccess(true)
    setLoading(false)
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex items-center justify-center p-4 sm:p-8"
      >
        <div className="w-full max-w-xs sm:max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="font-cal text-[32px] text-ink tracking-tighter leading-none">
              Reset Password
            </h1>
            <p className="text-muted text-[15px] font-medium">
              Enter your email to receive a password reset link.
            </p>
          </div>

          {success ? (
            <div className="bg-success/5 border border-success/20 p-4 rounded-md text-success text-[13px] font-medium">
              Check your email for the reset link. You can close this page.
            </div>
          ) : (
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

              {error && (
                <p className="text-error text-[12px] font-medium">{error}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-11 text-[14px]"
                disabled={loading}
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <p className="text-center text-[13px] text-muted font-medium">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-ink hover:underline transition-all font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  )
}
