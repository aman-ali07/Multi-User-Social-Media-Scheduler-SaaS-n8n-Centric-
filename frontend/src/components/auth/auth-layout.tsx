'use client'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen bg-canvas">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-surface-soft border-r border-hairline">
        <div>
          <div className="w-12 h-12 rounded-lg bg-surface-strong border border-hairline shadow-sm flex items-center justify-center mb-6">
            <span className="text-ink text-[20px] font-bold">C</span>
          </div>
          <h1 className="font-cal text-[40px] text-ink leading-tight tracking-tighter mb-4 max-w-sm">
            The operational layer for your content engine.
          </h1>
          <p className="text-[16px] text-muted font-medium max-w-sm">
            A premium, high-density environment designed for teams that treat distribution as an engineering problem.
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex -space-x-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-surface-soft bg-surface-strong shadow-sm" />
            ))}
          </div>
          <p className="text-[13px] text-muted font-medium">Join 2,000+ top operators</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center bg-canvas">
        {children}
      </div>
    </div>
  )
}
