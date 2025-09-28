// Cache management utilities for development
export const clearAllAppCache = () => {
  try {
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage);
    console.log('🧹 Clearing localStorage keys:', localStorageKeys);
    localStorage.clear();

    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    console.log('🧹 Clearing sessionStorage keys:', sessionStorageKeys);
    sessionStorage.clear();

    // Clear cookies (Supabase auth cookies)
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log('✅ All app cache cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
};

export const debugAuthState = () => {
  console.log('=== AUTH DEBUG INFO ===');
  console.log('📦 LocalStorage keys:', Object.keys(localStorage));
  console.log('📦 SessionStorage keys:', Object.keys(sessionStorage));
  console.log('🍪 Cookies:', document.cookie);
  console.log('🌐 Current URL:', window.location.href);
  console.log('⏰ Timestamp:', new Date().toISOString());

  // Check for Supabase specific data
  const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('sb-'));
  console.log('🔐 Supabase auth keys:', supabaseKeys);

  supabaseKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      console.log(`🔐 ${key}:`, value ? JSON.parse(value) : value);
    } catch {
      console.log(`🔐 ${key}:`, localStorage.getItem(key));
    }
  });

  console.log('======================');
};

// Development-only cache clearing for stuck auth states
export const clearAuthCacheIfStuck = () => {
  // Only in development
  if (import.meta.env.DEV) {
    const authKey = 'sb-rkczvecusafmebwgsmrb-auth-token';
    const lastClearKey = 'dev-last-auth-clear';
    const lastClear = localStorage.getItem(lastClearKey);
    const now = Date.now();

    // Only clear if it's been more than 5 minutes since last clear
    if (!lastClear || (now - parseInt(lastClear)) > 5 * 60 * 1000) {
      console.log('🧹 Development: Clearing potentially stuck auth cache');
      localStorage.removeItem(authKey);
      localStorage.setItem(lastClearKey, now.toString());
      return true;
    }
  }
  return false;
};

// Add global functions for easy debugging in console
if (typeof window !== 'undefined') {
  (window as any).clearAppCache = clearAllAppCache;
  (window as any).debugAuth = debugAuthState;
  (window as any).clearAuthCacheIfStuck = clearAuthCacheIfStuck;

  // Only show debug tools in development
  if (import.meta.env.DEV) {
    console.log('🔧 Development debug tools available:');
    console.log('   - clearAppCache() - Clears all cached data');
    console.log('   - debugAuth() - Shows current auth state');
    console.log('   - clearAuthCacheIfStuck() - Smart auth cache clearing');
  }
}