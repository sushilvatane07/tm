import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rjvpoagyktefuwuvqhax.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqdnBvYWd5a3RlZnV3dXZxaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5Nzk2NTYsImV4cCI6MjEwMDU1NTY1Nn0.ns28vaqVRx8jzyoRp0HMme1UWT3AQ6YNX_7_kbmPBWc"

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase env vars. Copy .env.example to .env and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'trustshare-auth-session',
  },
})
