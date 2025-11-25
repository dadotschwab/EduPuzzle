import { NavLink, Outlet } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { User, CreditCard, Users } from 'lucide-react'

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
]

export function SettingsLayout() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 sticky top-20 self-start">
            <nav className="space-y-1">
              {settingsNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
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
