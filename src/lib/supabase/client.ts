import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Get the env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY from .env.local")
}

// Create and export the client with proper auth configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Use PKCE flow for better security and session management
    flowType: 'pkce'
  }
})

// Clean up URL hash if it contains stale auth tokens
if (typeof window !== 'undefined') {
  // Check if URL has auth hash but session is invalid
  const hash = window.location.hash;
  if (hash.includes('access_token') || hash.includes('error')) {
    // Try to get valid session, if fails, clear the hash
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        // Session is invalid, clear the URL hash
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });
  }
}