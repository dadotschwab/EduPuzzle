import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface StickyHeaderProps {
  activeSection: string
  onNavigate: (sectionId: string) => void
}

const navItems = [
  { id: 'hero', label: 'Home' },
  { id: 'demo', label: 'Demo' },
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
]

export function StickyHeader({ activeSection, onNavigate }: StickyHeaderProps) {
  const { user } = useAuth()

  const handleLoginClick = useCallback(() => {
    window.location.href = '/login'
  }, [])

  const handleSignupClick = useCallback(() => {
    window.location.href = '/signup'
  }, [])

  const handleDashboardClick = useCallback(() => {
    window.location.href = '/app/dashboard'
  }, [])

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50" role="banner">
      <nav
        className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EduPuzzle
          </h1>
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-blue-600',
                  activeSection === item.id && 'text-blue-600'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <Button variant="gradient" onClick={handleDashboardClick}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleLoginClick}>
                Login
              </Button>
              <Button variant="gradient" onClick={handleSignupClick}>
                Sign Up
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
