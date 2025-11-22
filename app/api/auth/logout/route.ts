import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getServerSupabase } from "@/lib/supabase-auth"

export async function POST() {
  let signOutError: Error | null = null

  // Try to sign out from Supabase
  try {
    const supabase = await getServerSupabase()
    await supabase.auth.signOut()
  } catch (error) {
    console.error("Logout error:", error)
    signOutError = error instanceof Error ? error : new Error("Unknown error")
    // Continue to clear cookies even if signOut fails
  }

  // Always clear cookies, even if signOut failed
  try {
    const cookieStore = await cookies()
    cookieStore.delete("sb-access-token")
    cookieStore.delete("sb-refresh-token")
  } catch (cookieError) {
    console.error("Error clearing cookies:", cookieError)
    // If we can't clear cookies, return error
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }

  // Return success if cookies were cleared, even if signOut failed
  if (signOutError) {
    // Cookies were cleared, but signOut failed - still return success
    // as the user is effectively logged out (cookies are cleared)
    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    )
  }

  return NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  )
}
