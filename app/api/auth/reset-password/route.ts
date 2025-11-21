import { NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-auth"
import { rateLimitCheck, RATE_LIMITS } from "@/lib/rate-limit"
import { validateAndParse, getValidationErrorMessage } from "@/lib/validation"
import { resetPasswordSchema } from "@/lib/validation"

/**
 * POST /api/auth/reset-password - Reset password with token
 */
export async function POST(request: NextRequest) {
  // Check rate limit for auth endpoints (stricter)
  const rateLimitResponse = rateLimitCheck(request, RATE_LIMITS.AUTH)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()

    // Validate password
    const validationResult = await validateAndParse(
      resetPasswordSchema,
      { password: body.password, confirmPassword: body.confirmPassword },
    )
    if (!validationResult.success) {
      return NextResponse.json(
        { error: getValidationErrorMessage(validationResult.error) },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error("Supabase environment variables are not set")
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      )
    }

    const supabase = await getServerSupabase()

    // Check if we have a valid session
    // Note: The frontend should extract tokens from URL hash and set the session
    // before calling this API. The session is required to update the password.
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired reset token. Please use the link from your email to reset your password.",
        },
        { status: 400 }
      )
    }

    // Update password (requires valid session from reset token)
    const { error: updateError } = await supabase.auth.updateUser({
      password: validationResult.data.password,
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

    return NextResponse.json(
      {
        message: "Password reset successfully. You can now sign in with your new password.",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}

