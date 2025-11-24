import { Button } from '@/components/ui/button'
import { AnimatedPuzzle } from './AnimatedPuzzle'
import { useAuth } from '@/hooks/useAuth'

interface HeroSectionProps {
  onCtaClick: () => void
}

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  const { user } = useAuth()

  const handleWatchDemo = () => {
    // Scroll to demo section
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <AnimatedPuzzle className="mb-8 animate-bounce-in" />
        <h1
          id="hero-heading"
          className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-fade-in"
        >
          Master Vocabulary with AI-Powered Puzzles
        </h1>
        <p className="text-xl text-gray-600 mt-6 animate-slide-up">
          Transform learning into play with intelligent crossword puzzles that adapt to your
          knowledge level
        </p>
        <div className="mt-8 space-x-4">
          <Button size="lg" variant="gradient" onClick={onCtaClick}>
            {user ? 'Continue Learning' : 'Start Learning Free'}
          </Button>
          <Button variant="outline" size="lg" onClick={handleWatchDemo}>
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  )
}
