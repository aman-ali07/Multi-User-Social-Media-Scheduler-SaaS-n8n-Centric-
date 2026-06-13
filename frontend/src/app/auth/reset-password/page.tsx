'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword, error } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error: updateError } = await updatePassword(password)
    if (!updateError) {
      router.push('/dashboard')
    }
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
              New Password
            </h1>
            <p className="text-muted text-[15px] font-medium">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="password"
              label="New Password"
              type="password"
              placeholder="············"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </motion.div>
    </AuthLayout>
  )
}
