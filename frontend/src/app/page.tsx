import type { Metadata } from 'next'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorks } from '@/components/landing/how-it-works'
import { StatsBar } from '@/components/landing/stats-bar'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { CTASection } from '@/components/landing/cta-section'
import { Footer } from '@/components/landing/footer'
import { FloatingSignIn } from '@/components/landing/floating-sign-in'

export const metadata: Metadata = {
  title: 'Console — Social Media Scheduler',
  description: 'Schedule and publish content to Facebook and Instagram with ease. Connect your Meta accounts, create posts with media, and auto-publish at the perfect time.',
  openGraph: {
    title: 'Console — Social Media Scheduler',
    description: 'Schedule and publish content to Facebook and Instagram with ease.',
  },
}

export default function LandingPage() {
  return (
    <>
      <FloatingSignIn />
      <HeroSection />
      <FeaturesSection />
      <StatsBar />
      <HowItWorks />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </>
  )
}
