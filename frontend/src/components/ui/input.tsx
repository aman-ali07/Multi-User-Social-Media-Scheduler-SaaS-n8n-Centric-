import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-[13px] font-medium text-text-muted font-sans tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'h-10 w-full rounded-sm bg-surface-2 px-3 text-sm text-text',
            'border border-border placeholder:text-text-dim',
            'focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-colors duration-150 font-sans',
            error && 'border-red/50 focus:border-red/50 focus:ring-red/20',
            className,
          )}
          {...props}
        />
        {error && (
          <span className="text-[12px] text-red font-mono">{error}</span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
