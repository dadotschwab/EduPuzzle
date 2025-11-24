import { useCallback } from 'react'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { StickyHeader } from './StickyHeader'
import { HeroSection } from './HeroSection'
import { InteractiveDemo } from './InteractiveDemo'
import { FeaturesGrid } from './FeaturesGrid'
import { HowItWorks } from './HowItWorks'
import { Footer } from './Footer'

interface LandingPageProps {
  className?: string
}

const sectionIds = ['hero', 'demo', 'features', 'how-it-works']

export function LandingPage({ className }: LandingPageProps) {
  const { activeSection, scrollToSection } = useScrollSpy({
    sectionIds,
    offset: 100,
  })

  const handleNavigate = useCallback(
    (sectionId: string) => {
      scrollToSection(sectionId)
    },
    [scrollToSection]
  )

  const handleCtaClick = useCallback(() => {
    // TODO: Implement CTA click handler (navigate to signup/login)
    console.log('CTA clicked - navigate to signup')
  }, [])

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className || ''}`}
    >
      <StickyHeader activeSection={activeSection} onNavigate={handleNavigate} />

      <main>
        <HeroSection onCtaClick={handleCtaClick} />
        <ErrorBoundary>
          <InteractiveDemo />
        </ErrorBoundary>
        <FeaturesGrid />
        <HowItWorks />
      </main>

      <Footer />
    </div>
  )
}
