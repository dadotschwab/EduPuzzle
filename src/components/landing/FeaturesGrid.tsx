import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Brain, BookOpen, Users, Zap, Target, Trophy } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { cn } from '@/lib/utils'
import { memo } from 'react'

interface FeaturesGridProps {
  className?: string
}

interface Feature {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const features: Feature[] = [
  {
    title: 'AI-Powered Puzzles',
    description:
      'Intelligent crossword generation that adapts to your vocabulary level and learning progress.',
    icon: Brain,
  },
  {
    title: 'Spaced Repetition',
    description: 'Scientifically-proven learning intervals ensure you remember words long-term.',
    icon: Target,
  },
  {
    title: 'Collaborative Lists',
    description:
      'Share word lists with friends and study together in real-time collaborative sessions.',
    icon: Users,
  },
  {
    title: 'Smart Word Lists',
    description: 'Create and organize vocabulary by themes, difficulty levels, and learning goals.',
    icon: BookOpen,
  },
  {
    title: 'Instant Feedback',
    description:
      'Get immediate validation and hints to help you learn faster and more effectively.',
    icon: Zap,
  },
  {
    title: 'Progress Tracking',
    description:
      'Detailed analytics show your improvement and help you focus on challenging words.',
    icon: Trophy,
  },
]

export const FeaturesGrid = memo(function FeaturesGrid({ className }: FeaturesGridProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section id="features" className={`py-20 bg-gray-50 ${className || ''}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Why Choose EduPuzzle?</h2>
          <p className="text-xl text-gray-600">
            Transform vocabulary learning into an engaging, effective experience
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              hover="lift"
              className={cn(
                'group cursor-pointer transition-all duration-500',
                isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{
                transitionDelay: isIntersecting ? `${index * 100}ms` : '0ms',
              }}
            >
              <CardHeader>
                <feature.icon className="h-12 w-12 text-blue-600 group-hover:scale-110 transition-transform duration-300 mb-4" />
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
})
