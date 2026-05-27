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
      {showVerified && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center pt-8"
        >
          <div className="relative bg-gold/10 border border-gold/30 text-gold text-[12px] font-mono p-3 rounded-sm pr-8 max-w-sm w-full">
            Account created! Check your email to verify, then sign in below.
            <button
              onClick={() => setShowVerified(false)}
              className="absolute top-2 right-2 text-gold/60 hover:text-gold text-xs leading-none"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
      <AuthForm mode="login" onSubmit={handleLogin} />
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLayout><div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin mx-auto" /></AuthLayout>}>
      <LoginForm />
    </Suspense>
  )
}
