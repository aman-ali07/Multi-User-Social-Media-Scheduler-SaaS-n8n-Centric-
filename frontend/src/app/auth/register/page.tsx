'use client'

import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth/auth-layout'
import { AuthForm } from '@/components/auth/auth-form'
import { useAuth } from '@/hooks/use-auth'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()

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
