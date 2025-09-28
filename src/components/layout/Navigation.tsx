import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  MapPin,
  Settings,
  Users,
  BarChart3,
  Scan,
  AlertTriangle,
  Zap,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Scan', href: '/scan', icon: Scan },
  { name: 'Locations', href: '/locations', icon: MapPin, roles: ['manager', 'company_admin', 'super_admin'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['manager', 'company_admin', 'super_admin'] },
  { name: 'Variance', href: '/variance', icon: AlertTriangle, roles: ['manager', 'company_admin', 'super_admin'] },
  { name: 'Integrations', href: '/integrations', icon: Zap, roles: ['manager', 'company_admin', 'super_admin'] },
  { name: 'Team', href: '/team', icon: Users, roles: ['company_admin', 'super_admin'] },
  { name: 'Admin', href: '/admin', icon: Shield, roles: ['super_admin'] },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Navigation() {
  const location = useLocation()
  const { profile } = useAuth()

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(profile?.role || '')
  })

  return (
    <nav className="flex w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center justify-center border-b border-border">
        <h1 className="text-2xl font-bold text-gradient-8ball">8ball</h1>
      </div>
      <div className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              location.pathname.startsWith(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  )
}