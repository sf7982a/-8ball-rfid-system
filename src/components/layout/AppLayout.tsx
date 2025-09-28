// src/components/layout/AppLayout.tsx
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '../ui/button'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { profile, organization, signOut } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Inventory', href: '/inventory', icon: '📦' },
    { name: 'Scan', href: '/scan', icon: '📱' },
    { name: 'Locations', href: '/locations', icon: '📍', requireRole: 'manager' },
    { name: 'Reports', href: '/reports', icon: '📈', requireRole: 'manager' },
    { name: 'Variance', href: '/variance', icon: '⚠️', requireRole: 'manager' },
    { name: 'Integrations', href: '/integrations', icon: '🔌', requireRole: 'manager' },
    { name: 'Team', href: '/team', icon: '👥', requireRole: 'company_admin' },
    { name: 'Admin', href: '/admin', icon: '⚙️', requireRole: 'super_admin' },
    { name: 'Settings', href: '/settings', icon: '🔧' },
  ]

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (!item.requireRole) return true
    
    const roleHierarchy = {
      'staff': 1,
      'manager': 2,
      'company_admin': 3,
      'super_admin': 4
    }
    
    const userLevel = roleHierarchy[profile?.role as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[item.requireRole as keyof typeof roleHierarchy] || 0
    
    return userLevel >= requiredLevel
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <h1 className="text-lg sm:text-xl font-bold text-foreground">8ball RFID</h1>
            {organization && (
              <span className="hidden sm:block text-sm text-muted-foreground">
                {organization.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-32">
              {profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : profile?.email}
            </span>
            <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
              {profile?.role}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <nav className="hidden md:block w-64 bg-card border-r border-border min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
            <nav className="fixed top-0 left-0 bottom-0 flex flex-col w-64 max-w-xs bg-card border-r border-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">Navigation</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 p-4">
                <ul className="space-y-2">
                  {filteredNavigation.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <span className="mr-3 text-lg">{item.icon}</span>
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 w-0 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}