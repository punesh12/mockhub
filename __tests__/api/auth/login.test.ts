/**
 * Tests for /api/auth/login route
 */

import { POST } from "@/app/api/auth/login/route"
import { NextRequest } from "next/server"
import { getServerSupabase } from "@/lib/supabase-auth"
import { rateLimitCheck } from "@/lib/rate-limit"
import { validateAndParse } from "@/lib/validation"

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
  emailSchema: {
    required: jest.fn().mockReturnThis(),
    email: jest.fn().mockReturnThis(),
  },
  nameSchema: {
    required: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
  },
  endpointSchema: {
    required: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
  },
  httpMethodSchema: {
    required: jest.fn().mockReturnThis(),
    oneOf: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
  },
  statusCodeSchema: {
    required: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
  },
  forgotPasswordSchema: {},
  resetPasswordSchema: {},
}))

jest.mock("@/lib/form-validation", () => ({
  loginFormSchema: {},
}))


describe("POST /api/auth/login", () => {
  const mockSupabase = {
    auth: {
      signInWithPassword: jest.fn(),
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

  it("should login successfully with valid credentials", async () => {
    const mockSession = {
      access_token: "access-token",
      refresh_token: "refresh-token",
    }

    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: {
        name: "Test User",
      },
    }

    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "test@example.com",
        password: "password123",
      },
    })

    ;(mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        session: mockSession,
        user: mockUser,
      },
      error: null,
    })

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Login successful")
    expect(data.user).toEqual({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    })

    // Check cookies are set (mocked in jest.setup.js)
    expect(response.cookies).toBeDefined()
    expect(response.cookies.set).toHaveBeenCalled()
  })

  it("should return 400 if validation fails", async () => {
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: "Email is required" },
    })

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Email is required")
  })

  it("should return 401 if credentials are invalid", async () => {
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "test@example.com",
        password: "wrong-password",
      },
    })

    ;(mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        session: null,
        user: null,
      },
      error: {
        message: "Invalid login credentials",
      },
    })

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrong-password",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe("Invalid login credentials")
  })

  it("should return 500 if Supabase is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "test@example.com",
        password: "password123",
      },
    })

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Server configuration error. Please contact support.")
  })

  it("should return 500 if session creation fails", async () => {
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "test@example.com",
        password: "password123",
      },
    })

    ;(mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        session: null,
        user: null,
      },
      error: null,
    })

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Failed to create session")
  })

  it("should return 429 if rate limit is exceeded", async () => {
    ;(rateLimitCheck as jest.Mock).mockReturnValue(
      new Response(
        JSON.stringify({ error: "Too many authentication attempts" }),
        { status: 429 }
      )
    )

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe("Too many authentication attempts")
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })
})

