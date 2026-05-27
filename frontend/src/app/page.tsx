import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorks } from '@/components/landing/how-it-works'
import { StatsBar } from '@/components/landing/stats-bar'
import { Footer } from '@/components/landing/footer'
import { FloatingSignIn } from '@/components/landing/floating-sign-in'

export default function LandingPage() {
  return (
    <>
      <FloatingSignIn />
      <HeroSection />
      <FeaturesSection />
      <StatsBar />
      <HowItWorks />
      <Footer />
    </>
  )
}
