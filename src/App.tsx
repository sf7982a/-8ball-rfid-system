import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import './utils/cacheUtils' // Initialize debug tools

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
import { DebugAuth } from './components/auth/DebugAuth'

// Layout component
import AppLayout from './components/layout/AppLayout'



function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }
  
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/debug-auth" element={<DebugAuth />} />
        
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