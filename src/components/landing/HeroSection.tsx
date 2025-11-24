import { Button } from '@/components/ui/button'

// Placeholder for AnimatedPuzzle - will be implemented in Phase 4
function AnimatedPuzzle({ className }: { className?: string }) {
  return (
    <div
      className={`w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center ${className || ''}`}
    >
      <div className="text-center">
        <div className="text-6xl mb-4">🧩</div>
        <p className="text-gray-600">Animated Puzzle Visual</p>
      </div>
    </div>
  )
}

interface HeroSectionProps {
  onCtaClick: () => void
}

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  const handleWatchDemo = () => {
    // TODO: Scroll to demo section or open modal
    console.log('Watch demo clicked')
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <AnimatedPuzzle className="mb-8 animate-bounce-in" />
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
          Master Vocabulary with AI-Powered Puzzles
        </h1>
        <p className="text-xl text-gray-600 mt-6 animate-slide-up">
          Transform learning into play with intelligent crossword puzzles that adapt to your
          knowledge level
        </p>
        <div className="mt-8 space-x-4">
          <Button size="lg" variant="gradient" onClick={onCtaClick}>
            Start Learning Free
          </Button>
          <Button variant="outline" size="lg" onClick={handleWatchDemo}>
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  )
}
