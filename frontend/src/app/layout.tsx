import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const bilderberg = localFont({
  src: [
    { path: '../fonts/Bilderberg OTF.otf', weight: '400', style: 'normal' },
    { path: '../fonts/Bilderberg Italic OTF.otf', weight: '400', style: 'italic' },
  ],
  variable: '--font-bilderberg',
  display: 'swap',
  preload: true,
})

const satoshi = localFont({
  src: [
    { path: '../fonts/Satoshi-Light.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/Satoshi-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: true,
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(
        bilderberg.variable,
        satoshi.variable,
        jetbrainsMono.variable,
        'h-full antialiased',
      )}
    >
      <body className="min-h-screen bg-bg text-text" suppressHydrationWarning>
        <div className="noise-overlay" />
        <ErrorBoundary>{children}</ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
