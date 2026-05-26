'use client'

import { MotionNarrative } from './motion-narrative'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen">
      <div className="hidden lg:flex flex-1">
        <MotionNarrative />
      </div>
      <div className="flex-1 bg-surface border-l border-border">
        {children}
      </div>
    </div>
  )
}
