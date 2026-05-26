'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'gold'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles = {
  primary: 'bg-gold text-bg hover:bg-gold/90 active:bg-gold-dim border border-gold/30',
  secondary: 'bg-surface-2 text-text hover:bg-surface-3 border border-border active:border-border-focus',
  ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-surface-2 border border-transparent',
  destructive: 'bg-red/10 text-red hover:bg-red/20 border border-red/20',
  gold: 'bg-transparent text-gold hover:bg-gold/10 border border-gold/30',
}

const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-sm font-medium',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/50',
          'disabled:pointer-events-none disabled:opacity-40',
          'transition-colors duration-150 font-sans tracking-wide',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {children}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'
