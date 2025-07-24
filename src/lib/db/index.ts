import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// For production builds, we'll use Supabase client instead
// This is a server-side only setup for development
let db: any

if (typeof window === 'undefined') {
  // Server-side only
  const connectionString = import.meta.env.DATABASE_URL
  if (connectionString) {
    const client = postgres(connectionString)
    db = drizzle(client, { schema })
  }
}

// For now, we'll use a placeholder that throws an error
// In production, this should use Supabase's REST API
if (!db) {
  db = {
    select: () => { throw new Error('Database not available in browser - use Supabase client') },
    insert: () => { throw new Error('Database not available in browser - use Supabase client') },
    update: () => { throw new Error('Database not available in browser - use Supabase client') },
    delete: () => { throw new Error('Database not available in browser - use Supabase client') }
  }
}

export { db }