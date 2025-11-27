import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { cn } from '@/lib/utils'
import { BookOpen, Brain, Trophy } from 'lucide-react'

interface HowItWorksProps {
  className?: string
}

interface Step {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const steps: Step[] = [
  {
    title: 'Create Word Lists',
    description:
      'Build custom vocabulary collections organized by themes, difficulty levels, or learning goals.',
    icon: BookOpen,
  },
  {
    title: 'AI Generates Puzzles',
    description:
      'Our intelligent algorithm creates crossword puzzles that maximize word connections and learning effectiveness.',
    icon: Brain,
  },
  {
    title: 'Learn & Track Progress',
    description:
      'Solve puzzles, get instant feedback, and watch your vocabulary mastery grow with detailed analytics.',
    icon: Trophy,
  },
]

export function HowItWorks({ className }: HowItWorksProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section id="how-it-works" className={`py-20 bg-white ${className || ''}`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-gray-600">
            Three simple steps to transform your vocabulary learning
          </p>
        </div>

        <div ref={ref} className="relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 transform -translate-y-1/2 hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={cn(
                  'flex flex-col items-center text-center transition-all duration-700',
                  isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                )}
                style={{
                  transitionDelay: isIntersecting ? `${index * 200}ms` : '0ms',
                }}
              >
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-6 shadow-lg">
                  {index + 1}
                </div>
                <step.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
