'use client'

import { motion } from 'framer-motion'

interface FeatureCardProps {
  icon: string
  title: string
  description: string
  index: number
}

export function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
      className="group rounded-sm border border-border hover:border-gold/30 bg-surface/50 p-6 transition-all duration-300"
    >
      <span className="text-gold text-xl leading-none block mb-4">{icon}</span>
      <h3 className="font-serif text-[18px] text-text tracking-tight mb-2">{title}</h3>
      <p className="text-text-muted text-sm font-sans leading-relaxed">{description}</p>
    </motion.div>
  )
}
