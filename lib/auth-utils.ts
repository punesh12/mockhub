import {
  getServerUser,
  getServerSession,
  requireAuth as requireSupabaseAuth,
} from "./supabase-auth"

// Re-export Supabase Auth utilities for backward compatibility
export { getServerUser as getUserId }
export { getServerSession as getSession }
export { requireSupabaseAuth as requireAuth }

// Legacy interfaces for backward compatibility
export interface SessionUser {
  userId: string
  email: string
}

export interface Session {
  user: SessionUser
}

/**
 * Get session in legacy format (for backward compatibility)
 */
export async function getLegacySession(): Promise<Session | null> {
  const user = await getServerUser()

  if (!user) {
    return null
  }

  return {
    user: {
      userId: user.id,
      email: user.email || "",
    },
  }
}
