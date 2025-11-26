import { NavLink, Outlet } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { User, CreditCard, Users, BarChart3 } from 'lucide-react'

const settingsNavItems = [
  {
    title: 'Account',
    href: '/settings/account',
    icon: User,
  },
  {
    title: 'Subscription',
    href: '/settings/subscription',
    icon: CreditCard,
  },
  {
    title: 'Buddy',
    href: '/settings/buddy',
    icon: Users,
  },
  {
    title: 'Stats',
    href: '/settings/stats',
    icon: BarChart3,
  },
]

export function SettingsLayout() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-600 text-lg font-medium mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 sticky top-20 self-start">
            <nav className="space-y-2 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border-2 border-slate-200/60 p-4">
              {settingsNavItems.map((item, index) => {
                const Icon = item.icon
                const colors = [
                  { bg: 'bg-violet-500', border: 'border-violet-700', activeBg: 'bg-violet-600' },
                  { bg: 'bg-pink-500', border: 'border-pink-700', activeBg: 'bg-pink-600' },
                  { bg: 'bg-amber-500', border: 'border-amber-700', activeBg: 'bg-amber-600' },
                  { bg: 'bg-blue-500', border: 'border-blue-700', activeBg: 'bg-blue-600' },
                ]
                const colorSet = colors[index % colors.length]

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                        isActive
                          ? `${colorSet.activeBg} text-white border-2 ${colorSet.border} shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transform -translate-y-0.5 translate-x-0.5`
                          : 'text-slate-700 hover:bg-white/50 border-2 border-transparent hover:border-slate-200'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </NavLink>
                )
              })}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
