import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getServerSupabase } from "@/lib/supabase-auth"

export async function POST() {
  try {
    const supabase = await getServerSupabase()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete("sb-access-token")
    cookieStore.delete("sb-refresh-token")

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
