// Supabase client initialization
// Set environment variables in .env.local — NEVER commit credentials

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set.\n' +
    'The app is running in mock/demo mode. Set these in .env.local to connect to your Supabase project.'
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

export const isMockMode = !supabaseUrl || !supabaseAnonKey
