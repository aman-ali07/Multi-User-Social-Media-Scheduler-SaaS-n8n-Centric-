import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'
import { cn } from '@/lib/utils'
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

export const metadata: Metadata = {
  title: 'Console — Social Media Scheduler',
  description: 'Content orchestration platform for Facebook and Instagram',
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
        {children}
      </body>
    </html>
  )
}
