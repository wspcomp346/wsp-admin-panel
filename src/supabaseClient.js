import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://yjqetlkgprezkzperhee.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcWV0bGtncHJlemt6cGVyaGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMjk3MzYsImV4cCI6MjA2NTkwNTczNn0.A7tv-emQFYBudxTb1OB2FZGe2qBf3-vMKMK2NJs-KeU'

// Create the main supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

// For admin operations, you can create a service role client if needed:
// const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
// export const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null