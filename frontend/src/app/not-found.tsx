import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-canvas text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-4 relative">
          <h1 className="text-[120px] font-cal leading-none text-ink tracking-tighter opacity-10 select-none pointer-events-none">
            404
          </h1>
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
            <h2 className="text-[24px] font-cal tracking-tighter text-ink mb-2">Page not found</h2>
            <p className="text-[14px] text-muted font-medium mb-6">
              The page you are looking for doesn't exist or has been moved.
            </p>
            <Link href="/dashboard">
              <Button variant="primary" className="h-10 px-6">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}