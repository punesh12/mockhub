import { createServerSupabase } from "./supabase"
import { cookies } from "next/headers"
import { createClientSupabase } from "./supabase"

/**
 * Get Supabase client for server-side operations
 */
export async function getServerSupabase() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabase()

    // Get session from cookies
    const accessToken = cookieStore.get("sb-access-token")?.value
    const refreshToken = cookieStore.get("sb-refresh-token")?.value

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }

    return supabase
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    // Return a client even if session setting fails, so the request can continue
    // The getSession call will handle the error
    return createServerSupabase()
  }
}

/**
 * Get current user session (server-side)
 */
export async function getServerSession() {
  try {
    const supabase = await getServerSupabase()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    return session
  } catch (error) {
    console.error("Error getting server session:", error)
    return null
  }
}

/**
 * Get current user (server-side)
 */
export async function getServerUser() {
  try {
    const session = await getServerSession()
    return session?.user || null
  } catch (error) {
    console.error("Error getting server user:", error)
    return null
  }
}

/**
 * Require authentication (server-side)
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getServerUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

/**
 * Get Supabase client for client-side operations
 */
export function getClientSupabase() {
  return createClientSupabase()
}
