'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth/auth-layout'
import { AuthForm } from '@/components/auth/auth-form'
import { useAuth } from '@/hooks/use-auth'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, session, loading } = useAuth()

  useEffect(() => {
    if (!loading && session) {
      router.push('/dashboard')
    }
  }, [session, loading, router])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border border-muted/30 border-t-ink rounded-full animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (session) return null

  const handleRegister = async (email: string, password: string) => {
    const { error } = await signUp(email, password)
    if (error) throw error
    router.push('/auth/login?verified=1')
  }

  return (
    <AuthLayout>
      <AuthForm mode="register" onSubmit={handleRegister} />
    </AuthLayout>
  )
}
