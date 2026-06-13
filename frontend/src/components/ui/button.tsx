'use client'

import { forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles = {
  primary: 'bg-ink text-canvas border border-transparent active:bg-primary-active disabled:bg-primary-disabled disabled:text-muted',
  secondary: 'bg-canvas text-ink border border-hairline active:bg-surface-soft disabled:opacity-40',
  ghost: 'bg-transparent text-muted hover:text-ink hover:bg-black/5 border border-transparent active:bg-black/10 disabled:opacity-40',
  destructive: 'bg-error/10 text-error hover:bg-error/20 border border-error/20 active:bg-error/30 disabled:opacity-40',
}

const sizeStyles = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-5 text-[14px]',
  lg: 'h-12 px-6 text-[15px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-semibold',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-1',
          'disabled:pointer-events-none',
          'transition-colors duration-150',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
