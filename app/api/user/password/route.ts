import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { getServerSupabase } from "@/lib/supabase-auth"

/**
 * PUT /api/user/password - Change user password
 */
export const PUT = withAuth(async (request, user) => {

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate request body
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      )
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Verify current password by attempting to sign in
    const supabase = await getServerSupabase()

    // First, verify the current password
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: currentPassword,
      })

    if (signInError || !signInData.user) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json(
        {
          error: "Failed to update password",
          details:
            process.env.NODE_ENV === "development"
              ? updateError.message
              : undefined,
        },
        { status: 500 }
      )
    }

  return NextResponse.json({
    message: "Password updated successfully",
  })
})
