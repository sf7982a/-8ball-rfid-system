import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
  requireOrganization?: boolean
}

export function ProtectedRoute({
  children,
  requiredRole = 'staff',
  requireOrganization: _requireOrganization = true
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  console.log('🔒 ProtectedRoute check:', {
    loading,
    hasUser: !!user,
    hasProfile: !!profile,
    profileRole: profile?.role,
    currentPath: location.pathname,
    requiredRole
  })

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Avoid redirect loops by checking if we're already on the login page
  const isOnLoginPage = location.pathname === '/login' || location.pathname === '/signup'

  // Redirect to login if not authenticated - but only if we're not already on login/signup
  if (!user && !isOnLoginPage) {
    console.log('🔒 Redirecting to login: no user')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If on login page and we have a user, don't create a redirect loop
  if (user && isOnLoginPage) {
    console.log('🔒 User authenticated, redirecting from login to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  // Redirect to login if no profile exists - but only if not on login page
  if (user && !profile && !isOnLoginPage) {
    console.log('🔒 Redirecting to login: user exists but no profile')
    return <Navigate to="/login" replace />
  }

  // For now, allow access without organization (until setup pages are created)
  // if (requireOrganization && !organization) {
  //   return <Navigate to="/setup-organization" replace />
  // }

  // Check role permissions
  if (requiredRole && profile && !profile.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Access Pending</h2>
          <p className="text-gray-400">Your account is being set up. Please contact your administrator.</p>
        </div>
      </div>
    )
  }

  // Check if user has required role
  const hasAccess = (() => {
    const roleHierarchy = {
      'staff': 1,
      'manager': 2,
      'company_admin': 3,
      'super_admin': 4
    }

    const userLevel = roleHierarchy[profile?.role as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

    return userLevel >= requiredLevel
  })()

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Required role: {requiredRole}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Convenience components for common role requirements
export function ManagerRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="manager">
      {children}
    </ProtectedRoute>
  )
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="company_admin">
      {children}
    </ProtectedRoute>
  )
}

export function SuperAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="super_admin" requireOrganization={false}>
      {children}
    </ProtectedRoute>
  )
}