'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export function MotionNarrative() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-bg select-none"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="var(--color-gold)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--color-steel)" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <line x1="100" y1="0" x2="100" y2="900" stroke="var(--color-border)" strokeWidth="0.5" />
          <line x1="250" y1="0" x2="250" y2="900" stroke="var(--color-border)" strokeWidth="0.5" />
          <line x1="400" y1="0" x2="400" y2="900" stroke="var(--color-border)" strokeWidth="0.5" />
          <line x1="550" y1="0" x2="550" y2="900" stroke="var(--color-border)" strokeWidth="0.5" />
          <line x1="700" y1="0" x2="700" y2="900" stroke="var(--color-border)" strokeWidth="0.5" />
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
        >
          <line x1="0" y1="150" x2="800" y2="150" stroke="var(--color-border)" strokeWidth="0.5" />
          <line x1="0" y1="300" x2="800" y2="300" stroke="var(--color-border)" strokeWidth="0.5" />
          <line x1="0" y1="450" x2="800" y2="450" stroke="var(--color-border)" strokeWidth="0.5" />
          <line x1="0" y1="600" x2="800" y2="600" stroke="var(--color-border)" strokeWidth="0.5" />
          <line x1="0" y1="750" x2="800" y2="750" stroke="var(--color-border)" strokeWidth="0.5" />
        </motion.g>

        <motion.circle
          cx="250" cy="300" r="80"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="0.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />

        <motion.circle
          cx="550" cy="450" r="120"
          fill="none"
          stroke="var(--color-steel)"
          strokeWidth="0.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.8 }}
        />

        <motion.rect
          x="400" y="200" width="100" height="60"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1 }}
          className="origin-center"
          style={{ rotate: '45deg' }}
        />

        <motion.rect
          x="150" y="550" width="60" height="60"
          fill="none"
          stroke="var(--color-wine)"
          strokeWidth="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, rotate: 15 }}
          transition={{ duration: 1.5, delay: 1.2 }}
        />

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={200 + i * 80}
              y1={650}
              x2={200 + i * 80}
              y2={650 + (i % 2 === 0 ? 40 : -20)}
              stroke="var(--color-gold-dim)"
              strokeWidth="1"
              opacity={0.3 + i * 0.1}
            />
          ))}
        </motion.g>
      </svg>

      <div className="absolute inset-0 flex flex-col justify-center px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <span className="text-gold font-serif text-[52px] leading-[1.1] tracking-tight block">
            Console
          </span>
          <span className="text-text font-sans text-[15px] tracking-[0.3em] uppercase mt-3 block">
            Content Orchestration Platform
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-16 space-y-6"
        >
          {[
            { label: 'Orchestrate', desc: 'Multi-platform scheduling engine' },
            { label: 'Publish', desc: 'Direct-to-Meta API pipeline' },
            { label: 'Monitor', desc: 'Real-time failure detection & retry' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.5 + i * 0.2 }}
              className="flex items-center gap-4"
            >
              <span className="w-6 h-px bg-gold/50" />
              <div>
                <span className="text-text text-[13px] font-sans tracking-wide">{item.label}</span>
                <span className="text-text-dim text-[11px] font-sans ml-3">{item.desc}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
