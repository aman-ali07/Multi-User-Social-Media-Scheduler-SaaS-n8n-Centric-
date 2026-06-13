import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { ToastProvider } from '@/components/ui/toast'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Console — Social Media Scheduler',
    template: '%s — Console',
  },
  description: 'Schedule and publish content to Facebook and Instagram with ease. A content orchestration platform for creators and teams.',
  keywords: ['social media scheduler', 'Facebook scheduler', 'Instagram scheduler', 'content publishing', 'social media automation'],
  authors: [{ name: 'Console' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Console',
    title: 'Console — Social Media Scheduler',
    description: 'Schedule and publish content to Facebook and Instagram with ease.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Console — Social Media Scheduler',
    description: 'Schedule and publish content to Facebook and Instagram with ease.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

import { SmoothScroll } from '@/components/providers/smooth-scroll'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(
        inter.variable,
        'h-full antialiased',
      )}
    >
      <body className="min-h-screen bg-canvas text-body font-sans" suppressHydrationWarning>
        <ErrorBoundary>
          <SmoothScroll>
            <ToastProvider>{children}</ToastProvider>
          </SmoothScroll>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
