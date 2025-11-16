import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { getServerSupabase } from "@/lib/supabase-auth"

/**
 * PUT /api/user/password - Change user password
 */
export const PUT = withAuth(async (request, user) => {

    const body = await request.json()

    // Validate input using Yup validation
    const { validateAndParse, getValidationErrorMessage, changePasswordSchema } = await import("@/lib/validation")
    const validationResult = await validateAndParse(changePasswordSchema, body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: getValidationErrorMessage(validationResult.error) },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validationResult.data

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
