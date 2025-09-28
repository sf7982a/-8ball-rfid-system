import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

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
import AdminPage from './pages/admin/AdminPage'

// Layout component
import AppLayout from './components/layout/AppLayout'



function AppRoutes() {
  const { loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
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
        
        <Route path="/variance" element={
          <ProtectedRoute requiredRole="manager">
            <AppLayout>
              <VariancePage />
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
    <div className="min-h-screen bg-background text-foreground">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </div>
  )
}

export default App