import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingWithTimeout from './components/LoadingWithTimeout'

// Import your page components
import LoginPage from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import { InventoryPage } from './pages/inventory/InventoryPage'
import { ScanPage } from './pages/scan/ScanPage'
import { LocationsPage } from './pages/locations/LocationsPage'
import ReportsPage from './pages/reports/ReportsPage'
import TeamPage from './pages/team/TeamPage'
import SettingsPage from './pages/settings/SettingsPage'
import VariancePage from './pages/dashboard/VariancePage'
import IntegrationsPage from './pages/integrations/IntegrationsPage'
import AdminPage from './pages/admin/AdminPage'

// Layout component
import AppLayout from './components/layout/AppLayout'



function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <LoadingWithTimeout
        message="Authenticating..."
        timeout={12000}
        onTimeout={() => {
          console.warn('Authentication taking longer than expected')
        }}
        onRetry={() => {
          window.location.reload()
        }}
      />
    )
  }
  
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected redirect root to dashboard */}
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/inventory" element={
          <ProtectedRoute>
            <AppLayout>
              <InventoryPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/scan" element={
          <ProtectedRoute>
            <AppLayout>
              <ScanPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/locations" element={
          <ProtectedRoute requiredRole="manager">
            <AppLayout>
              <LocationsPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute requiredRole="manager">
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/team" element={
          <ProtectedRoute requiredRole="company_admin">
            <AppLayout>
              <TeamPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/variance" element={
          <ProtectedRoute requiredRole="manager">
            <AppLayout>
              <VariancePage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/integrations" element={
          <ProtectedRoute requiredRole="manager">
            <AppLayout>
              <IntegrationsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute requiredRole="super_admin">
            <AppLayout>
              <AdminPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </div>
    </ErrorBoundary>
  )
}

export default App