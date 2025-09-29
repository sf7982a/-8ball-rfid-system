import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { validateEnvironment } from './lib/config'

// Validate environment configuration on startup
try {
  validateEnvironment()
} catch (error) {
  console.error('❌ Environment validation failed:', error)
  // In development, show error; in production, handle gracefully
  if (import.meta.env.DEV) {
    throw error
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)