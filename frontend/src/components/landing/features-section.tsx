'use client'

import { motion } from 'framer-motion'
import { FeatureCard } from './feature-card'

const features = [
  {
    icon: '◈',
    title: 'Multi-Platform Orchestration',
    description: 'Manage Facebook Pages and Instagram Business accounts from a single console. One interface, two platforms, consistent branding.',
  },
  {
    icon: '◇',
    title: 'Intelligent Scheduling',
    description: 'Set your publish times and let Console handle the rest. Automatic retry with exponential backoff when things go wrong.',
  },
  {
    icon: '⏣',
    title: 'Real-Time Monitoring',
    description: 'Detailed activity logs, token health checks, and failure diagnostics. Know exactly what happened and when.',
  },
]

export function FeaturesSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <span className="text-[11px] text-gold font-mono uppercase tracking-[0.25em]">Features</span>
        <h2 className="font-serif text-[32px] md:text-[40px] text-text tracking-tight mt-3">
          Everything you need
        </h2>
        <p className="text-text-muted text-sm font-sans mt-3 max-w-md mx-auto">
          Built for content teams who need reliability without the complexity.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <FeatureCard key={f.title} {...f} index={i} />
        ))}
      </div>
    </section>
  )
}
