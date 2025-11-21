import { NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-auth"
import { rateLimitCheck, RATE_LIMITS } from "@/lib/rate-limit"
import { validateAndParse, getValidationErrorMessage } from "@/lib/validation"
import { forgotPasswordSchema } from "@/lib/validation"

/**
 * POST /api/auth/forgot-password - Send password reset email
 */
export async function POST(request: NextRequest) {
  // Check rate limit for forgot password (more lenient than login)
  const rateLimitResponse = rateLimitCheck(request, RATE_LIMITS.FORGOT_PASSWORD)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()

    // Validate input using Yup
    const validationResult = await validateAndParse(forgotPasswordSchema, body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: getValidationErrorMessage(validationResult.error) },
        { status: 400 }
      )
    }

    const { email } = validationResult.data

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

    // Get the base URL for the reset password redirect
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000"

    // Send password reset email via Supabase Auth
    const supabase = await getServerSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/reset-password`,
    })

    // Always return success to prevent email enumeration
    // Supabase will only send email if user exists
    if (error) {
      console.error("Password reset error:", error)
      // Still return success to prevent email enumeration
    }

    return NextResponse.json(
      {
        message:
          "If an account with that email exists, we've sent a password reset link.",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
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

