'use client'

import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth/auth-layout'
import { AuthForm } from '@/components/auth/auth-form'
import { useAuth } from '@/hooks/use-auth'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()

  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password)
    if (error) throw error
    router.push('/dashboard')
  }

  return (
    <AuthLayout>
      <AuthForm mode="login" onSubmit={handleLogin} />
    </AuthLayout>
  )
}
