'use client'


import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Share2, Camera, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'

import { useAccounts } from '@/hooks/use-accounts'

export default function OnboardingPage() {
  const { user } = useAuth()
  const { connect } = useAccounts()
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)

  const handleConnect = () => {
    setConnecting(true)
    connect('facebook')
  }

  const handleFinish = () => {
    localStorage.setItem('has_skipped_onboarding', '1')
    router.push('/dashboard')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-surface-card rounded-xl shadow-sm p-8"
          >
            <div className="w-12 h-12 rounded-lg bg-surface-strong border border-hairline flex items-center justify-center mb-6">
              <span className="text-ink text-[20px] font-bold">C</span>
            </div>
            <h1 className="font-cal text-[32px] text-ink leading-tight tracking-tighter mb-2">Welcome to Console.</h1>
            <p className="text-[15px] text-muted font-medium mb-8">Before we boot up your dashboard, let's connect your distribution channels.</p>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between p-4 rounded-lg bg-canvas border border-hairline">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-[#1877F2]" />
                  <span className="text-[14px] font-semibold text-ink">Facebook Pages</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-surface-strong" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-canvas border border-hairline">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-[#E1306C]" />
                  <span className="text-[14px] font-semibold text-ink">Instagram Business</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-surface-strong" />
              </div>
            </div>

            <Button 
              variant="primary" 
              className="w-full h-11 text-[14px]"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {connecting ? 'Connecting...' : 'Connect Meta Accounts'}
            </Button>
            <div className="mt-4 text-center">
               <button onClick={handleFinish} className="text-muted hover:text-ink text-[13px] font-medium transition-colors">Skip for now</button>
            </div>
          </motion.div>

        </div>
      </div>
    </AuthGuard>
  )
}
