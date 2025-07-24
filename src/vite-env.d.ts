/// <reference types="vite/client" />

declare global {
  // eslint-disable-next-line no-unused-vars
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_DATABASE_URL: string
  }
}

export {}