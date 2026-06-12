'use client'

import { motion } from 'framer-motion'

export function TopographicLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="topo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.08" />
            <stop offset="50%" stopColor="var(--color-steel)" stopOpacity="0.04" />
            <stop offset="100%" stopColor="var(--color-wine)" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          fill="none"
          stroke="url(#topo-grad)"
          strokeWidth="0.5"
        >
          {[
            'M-100,200 C200,100 400,300 600,200 S900,400 1200,250 S1500,300 1600,200',
            'M-100,300 C200,400 400,200 600,350 S900,150 1200,300 S1500,400 1600,300',
            'M-100,400 C200,250 400,450 600,300 S900,500 1200,350 S1500,250 1600,400',
            'M-100,500 C200,600 400,400 600,550 S900,350 1200,500 S1500,600 1600,500',
            'M-100,600 C200,500 400,700 600,550 S900,750 1200,600 S1500,500 1600,600',
            'M-100,700 C200,800 400,600 600,750 S900,550 1200,700 S1500,800 1600,700',
            'M-100,800 C200,700 400,900 600,750 S900,950 1200,800 S1500,700 1600,800',
            'M-100,100 C200,200 400,100 600,200 S900,50 1200,150 S1500,100 1600,100',
            'M-100,0 C200,100 400,-100 600,50 S900,-50 1200,50 S1500,100 1600,0',
            'M-100,900 C200,800 400,1000 600,850 S900,1050 1200,900 S1500,800 1600,900',
            'M-100,150 C200,50 400,200 600,100 S900,300 1200,150 S1500,200 1600,150',
            'M-100,450 C200,350 400,550 600,400 S900,600 1200,450 S1500,350 1600,450',
            'M-100,650 C200,550 400,750 600,600 S900,800 1200,650 S1500,550 1600,650',
            'M-100,350 C200,450 400,250 600,400 S900,200 1200,350 S1500,450 1600,350',
            'M-100,750 C200,650 400,850 600,700 S900,900 1200,750 S1500,650 1600,750',
          ].map((d, i) => (
            <motion.path
              key={i}
              d={d}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 + (i % 3) * 0.15 + (i % 2) * 0.05 }}
              transition={{
                duration: 3 + i * 0.2,
                delay: 0.5 + i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="0.3"
          opacity={0.3}
        >
          <line x1="360" y1="0" x2="360" y2="900" />
          <line x1="720" y1="0" x2="720" y2="900" />
          <line x1="1080" y1="0" x2="1080" y2="900" />
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 2 }}
          fill="none"
          stroke="var(--color-gold-dim)"
          strokeWidth="0.5"
          opacity={0.15}
        >
          <motion.circle
            cx="720" cy="450" r="200"
            animate={{ r: [200, 220, 200] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="720" cy="450" r="300"
            animate={{ r: [300, 320, 300] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="720" cy="450" r="400"
            animate={{ r: [400, 415, 400] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>
      </svg>
    </div>
  )
}
