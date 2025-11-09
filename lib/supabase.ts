import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === "undefined") {
    // Server-side: log error
    console.error(
      "❌ Supabase environment variables are missing!\n" +
        "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.\n" +
        "Get these from your Supabase project dashboard → Settings → API"
    )
  } else {
    // Client-side: log warning
    console.warn(
      "Supabase URL and Anon Key are required. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
    )
  }
}

// Client-side Supabase client (for browser usage)
export function createClientSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

// Server-side Supabase client (for API routes and server components)
export function createServerSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Default export for client-side usage
export const supabase = createClientSupabase()
