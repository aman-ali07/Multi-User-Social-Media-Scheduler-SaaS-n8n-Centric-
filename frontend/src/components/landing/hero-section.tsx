'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { TopographicLines } from './topographic-lines'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg py-12 sm:py-0">
      <TopographicLines />

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-6 max-w-3xl"
      >
        <motion.div variants={item} className="mb-6">
          <span className="inline-block text-[10px] text-gold font-mono uppercase tracking-[0.3em] border border-gold/20 rounded-sm px-3 py-1">
            v0.1 — Content Orchestration Platform
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="font-serif text-[56px] sm:text-[72px] md:text-[80px] text-text tracking-tight leading-[0.95]"
        >
          Orchestrate Your Content.<br />
          Amplify Your Reach.
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-4 font-serif text-[24px] sm:text-[28px] tracking-[0.15em] text-text-muted"
        >
          Console
        </motion.p>

        <motion.p
          variants={item}
          className="mt-6 text-[16px] sm:text-[18px] text-text-muted font-sans leading-relaxed max-w-xl mx-auto"
        >
          Schedule, publish, and monitor social content across Facebook and Instagram — from one console.
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center h-12 px-8 rounded-sm bg-gold text-bg font-sans text-sm font-medium tracking-wide hover:bg-gold/90 active:bg-gold-dim transition-colors border border-gold/30"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center h-12 px-8 rounded-sm bg-transparent text-text-muted font-sans text-sm font-medium tracking-wide hover:text-text hover:bg-surface-2 transition-colors border border-border"
          >
            Sign In
          </Link>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-16 flex items-center justify-center gap-2 text-text-dim"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest">Scroll</span>
          <motion.span
            className="text-sm"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            ↓
          </motion.span>
        </motion.div>
      </motion.div>
    </section>
  )
}
