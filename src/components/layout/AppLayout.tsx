import { Link } from 'react-router-dom'
import { ProfileMenu } from './ProfileMenu'
import { memo } from 'react'
import { Puzzle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout = memo(function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      {/* Top navigation bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/app" className="flex items-center gap-2 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition-all duration-300 shadow-md shadow-violet-200 group-hover:shadow-lg group-hover:shadow-violet-300">
                  <Puzzle size={20} className="fill-white/20" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                  EduPuzzle
                </h1>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                <Link to="/app/dashboard">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-violet-600 hover:bg-violet-50">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/app/todays-puzzles">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-violet-600 hover:bg-violet-50">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Today's Practice
                  </Button>
                </Link>
              </nav>
            </div>
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="pb-8">{children}</main>
    </div>
  )
})
