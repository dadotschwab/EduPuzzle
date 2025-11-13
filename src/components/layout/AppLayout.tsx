import { ProfileMenu } from './ProfileMenu'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">EDU-PUZZLE</h1>
            </div>
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main>{children}</main>
    </div>
  )
}
