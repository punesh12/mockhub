/**
 * Tests for /api/auth/reset-password route
 */

import { POST } from "@/app/api/auth/reset-password/route"
import { NextRequest } from "next/server"
import { getServerSupabase } from "@/lib/supabase-auth"
import { rateLimitCheck, RATE_LIMITS } from "@/lib/rate-limit"
import { validateAndParse, getValidationErrorMessage } from "@/lib/validation"
import { resetPasswordSchema } from "@/lib/validation"

// Mock dependencies
jest.mock("@/lib/supabase-auth", () => ({
  getServerSupabase: jest.fn(),
}))

jest.mock("@/lib/rate-limit", () => ({
  rateLimitCheck: jest.fn(),
  RATE_LIMITS: {
    AUTH: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
      message: "Too many authentication attempts",
    },
  },
}))

jest.mock("@/lib/validation", () => ({
  validateAndParse: jest.fn(),
  getValidationErrorMessage: jest.fn((error) => error.message || "Validation error"),
  resetPasswordSchema: {},
}))

describe("POST /api/auth/reset-password", () => {
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
      updateUser: jest.fn(),
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
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  it("should reset password successfully with valid session", async () => {
    const mockSession = {
      access_token: "access-token",
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    }

    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        password: "newPassword123",
        confirmPassword: "newPassword123",
      },
    })

    ;(mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: mockSession,
      },
    })

    ;(mockSupabase.auth.updateUser as jest.Mock).mockResolvedValue({
      error: null,
    })

    const requestBody = {
      password: "newPassword123",
      confirmPassword: "newPassword123",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
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
    expect(data.message).toContain("Password reset successfully")
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      password: "newPassword123",
    })
  })

  it("should return 400 if validation fails", async () => {
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: "Passwords do not match" },
    })

    const requestBody = {
      password: "newPassword123",
      confirmPassword: "differentPassword",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
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
    expect(data.error).toBe("Passwords do not match")
  })

  it("should return 400 if no session exists", async () => {
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        password: "newPassword123",
        confirmPassword: "newPassword123",
      },
    })

    ;(mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: null,
      },
    })

    const requestBody = {
      password: "newPassword123",
      confirmPassword: "newPassword123",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
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
    expect(data.error).toContain("Invalid or expired reset token")
    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it("should return 500 if password update fails", async () => {
    const mockSession = {
      access_token: "access-token",
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    }

    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        password: "newPassword123",
        confirmPassword: "newPassword123",
      },
    })

    ;(mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: mockSession,
      },
    })

    ;(mockSupabase.auth.updateUser as jest.Mock).mockResolvedValue({
      error: {
        message: "Password update failed",
      },
    })

    const requestBody = {
      password: "newPassword123",
      confirmPassword: "newPassword123",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
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
    expect(data.error).toBe("Failed to update password")
  })

  it("should return 500 if Supabase is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        password: "newPassword123",
        confirmPassword: "newPassword123",
      },
    })

    const requestBody = {
      password: "newPassword123",
      confirmPassword: "newPassword123",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
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
        JSON.stringify({ error: "Too many authentication attempts" }),
        { status: 429 }
      )
    )

    const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
    }) as NextRequest & { json: jest.Mock }

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe("Too many authentication attempts")
    expect(mockSupabase.auth.getSession).not.toHaveBeenCalled()
  })
})

