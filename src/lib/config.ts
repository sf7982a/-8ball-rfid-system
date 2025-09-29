// Environment configuration for 8Ball RFID application
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  app: {
    env: import.meta.env.VITE_APP_ENV || 'development',
    name: import.meta.env.VITE_APP_NAME || '8Ball RFID',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    isStaging: import.meta.env.VITE_APP_ENV === 'staging',
    isProduction: import.meta.env.VITE_APP_ENV === 'production',
    isDevelopment: import.meta.env.VITE_APP_ENV === 'development',
  },
  features: {
    // Feature flags for different environments
    enableDebugMode: import.meta.env.VITE_APP_ENV !== 'production',
    enableRFIDSimulation: import.meta.env.VITE_ENABLE_RFID_SIMULATION === 'true' || import.meta.env.VITE_APP_ENV !== 'production',
    enableAnalytics: import.meta.env.VITE_APP_ENV === 'production',
    enableErrorReporting: import.meta.env.VITE_APP_ENV !== 'development',
  },
  urls: {
    // Different URLs for different environments
    api: import.meta.env.VITE_API_URL || '',
    dashboard: import.meta.env.VITE_DASHBOARD_URL || '',
    support: import.meta.env.VITE_SUPPORT_URL || 'mailto:support@8ball-rfid.com',
  }
}

// Environment validation
export function validateEnvironment() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ]

  const missing = required.filter(key => !import.meta.env[key])

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }

  // Log environment info (excluding sensitive data)
  console.log('🌍 Environment:', config.app.env)
  console.log('📱 App:', config.app.name, config.app.version)
  console.log('🔧 Features:', {
    debugMode: config.features.enableDebugMode,
    rfidSimulation: config.features.enableRFIDSimulation,
    analytics: config.features.enableAnalytics
  })
}

// Environment-specific styling helpers
export const environmentStyles = {
  staging: {
    backgroundColor: '#fbbf24', // yellow-400
    color: '#000000',
    badge: 'STAGING'
  },
  development: {
    backgroundColor: '#10b981', // green-500
    color: '#ffffff',
    badge: 'DEV'
  },
  production: {
    // No styling for production
    backgroundColor: '',
    color: '',
    badge: ''
  }
}

export function getEnvironmentStyle() {
  return environmentStyles[config.app.env as keyof typeof environmentStyles] || environmentStyles.development
}