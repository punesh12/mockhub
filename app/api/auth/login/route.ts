import { NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-auth"
import { rateLimitCheck, RATE_LIMITS } from "@/lib/rate-limit"
import { validateAndParse, getValidationErrorMessage } from "@/lib/validation"
import { loginFormSchema } from "@/lib/form-validation"

export async function POST(request: NextRequest) {
  // Check rate limit for auth endpoints (stricter)
  const rateLimitResponse = rateLimitCheck(request, RATE_LIMITS.AUTH)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()

    // Validate input using Yup
    const validationResult = await validateAndParse(loginFormSchema, body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: getValidationErrorMessage(validationResult.error) },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

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

    // Authenticate with Supabase Auth
    const supabase = await getServerSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message || "Invalid email or password" },
        { status: 401 }
      )
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      )
    }

    // Create response with user data
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
        },
      },
      { status: 200 }
    )

    // Set session cookies
    response.cookies.set("sb-access-token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    response.cookies.set("sb-refresh-token", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
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
