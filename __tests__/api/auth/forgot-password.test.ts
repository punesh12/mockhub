/**
 * Tests for /api/auth/forgot-password route
 */

import { POST } from "@/app/api/auth/forgot-password/route"
import { NextRequest } from "next/server"
import { getServerSupabase } from "@/lib/supabase-auth"
import { rateLimitCheck, RATE_LIMITS } from "@/lib/rate-limit"
import { validateAndParse, getValidationErrorMessage } from "@/lib/validation"
import { forgotPasswordSchema } from "@/lib/validation"

// Mock dependencies
jest.mock("@/lib/supabase-auth", () => ({
  getServerSupabase: jest.fn(),
}))

jest.mock("@/lib/rate-limit", () => ({
  rateLimitCheck: jest.fn(),
  RATE_LIMITS: {
    FORGOT_PASSWORD: {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
      message: "Too many password reset requests",
    },
  },
}))

jest.mock("@/lib/validation", () => ({
  validateAndParse: jest.fn(),
  getValidationErrorMessage: jest.fn((error) => error.message || "Validation error"),
  forgotPasswordSchema: {},
}))

describe("POST /api/auth/forgot-password", () => {
  const mockSupabase = {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Default: no rate limit
    ;(rateLimitCheck as jest.Mock).mockReturnValue(null)
    ;(getServerSupabase as jest.Mock).mockResolvedValue(mockSupabase)
    
    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  it("should send password reset email successfully", async () => {
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "test@example.com",
      },
    })

    ;(mockSupabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      error: null,
    })

    const requestBody = {
      email: "test@example.com",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain("If an account with that email exists")
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "test@example.com",
      {
        redirectTo: "http://localhost:3000/auth/reset-password",
      }
    )
  })

  it("should return 400 if validation fails", async () => {
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: "Email is required" },
    })

    const requestBody = {
      email: "",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Email is required")
  })

  it("should return success even if email doesn't exist (prevent enumeration)", async () => {
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "nonexistent@example.com",
      },
    })

    ;(mockSupabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      error: {
        message: "User not found",
      },
    })

    const requestBody = {
      email: "nonexistent@example.com",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request)
    const data = await response.json()

    // Should still return success to prevent email enumeration
    expect(response.status).toBe(200)
    expect(data.message).toContain("If an account with that email exists")
  })

  it("should use origin header if NEXT_PUBLIC_APP_URL is not set", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL

    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "test@example.com",
      },
    })

    ;(mockSupabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      error: null,
    })

    const requestBody = {
      email: "test@example.com",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
        origin: "https://example.com",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    await POST(request)

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "test@example.com",
      {
        redirectTo: "https://example.com/auth/reset-password",
      }
    )
  })

  it("should return 500 if Supabase is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "test@example.com",
      },
    })

    const requestBody = {
      email: "test@example.com",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Server configuration error. Please contact support.")
  })

  it("should return 429 if rate limit is exceeded", async () => {
    ;(rateLimitCheck as jest.Mock).mockReturnValue(
      new Response(
        JSON.stringify({ error: "Too many password reset requests" }),
        { status: 429 }
      )
    )

    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
    }) as NextRequest & { json: jest.Mock }

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe("Too many password reset requests")
    expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
  })
})

