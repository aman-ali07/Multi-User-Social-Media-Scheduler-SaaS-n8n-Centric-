'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Zap } from 'lucide-react'

export default function BillingPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="font-cal text-[24px] text-ink mb-1 tracking-tight">Plan & Billing</h2>
        <p className="text-[13px] text-muted font-medium">Manage your subscription and billing details.</p>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-brand-accent/5 rounded-full blur-3xl -z-10" />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-canvas bg-ink px-2 py-0.5 rounded-sm">Current Plan</span>
          </div>
          <h3 className="font-cal text-[20px] text-ink">Free Tier</h3>
          <p className="text-[13px] text-muted font-medium mt-1 max-w-sm">
            You are currently on the free tier. Upgrade to Pro for unlimited scheduling, analytics, and team collaboration.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="mb-2">
            <span className="font-cal text-[32px] text-ink">$0</span>
            <span className="text-[13px] text-muted font-medium">/mo</span>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-hairline">
        <div className="mb-6">
          <h3 className="font-cal text-[20px] text-ink flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-accent" />
            Upgrade to Pro
          </h3>
          <p className="text-[13px] text-muted font-medium mt-1">Unlock the full potential of your workspace.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {['Unlimited posts per month', 'Advanced AI Composer features', 'Detailed analytics \u0026 insights', 'Priority support'].map((feature, i) => (
              <div key={i} className="flex items-start gap-2 text-[13px] text-ink font-medium">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center bg-surface-soft rounded-lg border border-hairline p-6">
             <div className="text-center w-full">
               <span className="font-cal text-[32px] text-ink block mb-4">$29<span className="text-[16px] text-muted">/mo</span></span>
               <Button variant="primary" className="w-full h-10 shadow-lg shadow-brand-accent/20">
                 Upgrade Now
               </Button>
               <p className="text-[10px] text-muted font-medium mt-3 uppercase tracking-widest">Powered by Stripe</p>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
