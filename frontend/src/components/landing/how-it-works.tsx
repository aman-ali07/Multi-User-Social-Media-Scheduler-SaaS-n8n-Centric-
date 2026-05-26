'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Connect Your Accounts',
    description: 'Link your Facebook pages and Instagram business accounts in one click. Console handles the OAuth flow and token refresh automatically.',
  },
  {
    number: '02',
    title: 'Compose Your Content',
    description: 'Write captions, upload media, and preview how your post will look across platforms. Save drafts or schedule for later.',
  },
  {
    number: '03',
    title: 'Publish on Autopilot',
    description: 'Console delivers your content through the Meta Graph API at the scheduled time. Failed posts retry automatically with detailed logs.',
  },
]

export function HowItWorks() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-20"
      >
        <span className="text-[11px] text-gold font-mono uppercase tracking-[0.25em]">
          How It Works
        </span>
        <h2 className="font-serif text-[32px] md:text-[40px] text-text tracking-tight mt-3">
          Three steps to go live
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[32px] font-serif text-gold leading-none">{step.number}</span>
              {i < steps.length - 1 && (
                <div className="hidden md:block flex-1 h-px bg-border" />
              )}
            </div>
            <h3 className="font-sans text-[16px] text-text font-medium tracking-wide mb-2">
              {step.title}
            </h3>
            <p className="text-text-muted text-sm font-sans leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
