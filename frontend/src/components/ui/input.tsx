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
          <label htmlFor={id} className="text-[14px] font-semibold text-ink tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'h-10 w-full rounded-md bg-canvas px-3.5 text-[16px] text-ink',
            'border border-hairline placeholder:text-muted/60',
            'focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/10',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-colors duration-150',
            error && 'border-error/50 focus:border-error',
            className,
          )}
          {...props}
        />
        {error && (
          <span className="text-[12px] text-error font-medium mt-1">{error}</span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
