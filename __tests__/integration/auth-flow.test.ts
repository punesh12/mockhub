/**
 * Integration tests for authentication flow
 */

import { NextRequest } from "next/server"
import { POST as signupPOST } from "@/app/api/auth/signup/route"
import { POST as loginPOST } from "@/app/api/auth/login/route"
import { GET as meGET } from "@/app/api/auth/me/route"
import { POST as logoutPOST } from "@/app/api/auth/logout/route"
import { prisma } from "@/lib/prisma"
import { getServerSupabase } from "@/lib/supabase-auth"
import { createMockUser } from "@/tests/utils/mock-data"

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock("@/lib/supabase-auth", () => ({
  getServerSupabase: jest.fn(),
}))

jest.mock("@/lib/api-auth", () => ({
  withAuth: jest.fn((handler) => handler),
  withOptionalAuth: jest.fn((handler) => handler),
}))

jest.mock("@/lib/validation", () => {
  const mockSchema = {
    optional: jest.fn(() => mockSchema),
    required: jest.fn(() => mockSchema),
  }
  return {
    validateAndParse: jest.fn((schema, data) => ({
      success: true,
      data,
    })),
    emailSchema: mockSchema,
    nameSchema: mockSchema,
    passwordSchema: mockSchema,
    endpointSchema: mockSchema,
    httpMethodSchema: mockSchema,
    statusCodeSchema: mockSchema,
    loginFormSchema: {},
  }
})

jest.mock("@/lib/form-validation", () => {
  const mockSchema = {
    optional: jest.fn(() => mockSchema),
    required: jest.fn(() => mockSchema),
  }
  return {
    loginFormSchema: {},
    signupFormSchema: {},
    updateMockApiFormSchema: {},
    nameSchema: mockSchema,
    endpointSchema: mockSchema,
    httpMethodSchema: mockSchema,
    statusCodeSchema: mockSchema,
  }
})

jest.mock("@/lib/input-security", () => ({
  validateAndSanitizeSignup: jest.fn((data) => ({
    success: true,
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
    },
  })),
}))

jest.mock("@/lib/rate-limit", () => ({
  rateLimitCheck: jest.fn(() => null),
  RATE_LIMITS: {
    AUTH: { maxRequests: 10, windowMs: 60000 },
  },
}))

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    delete: jest.fn(),
    set: jest.fn(),
  })),
}))

describe("Authentication Flow Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should complete full authentication flow: signup -> login -> me -> logout", async () => {
    const testEmail = "test@example.com"
    const testPassword = "TestPassword123!"
    const testUserId = "user-123"

    // Step 1: Signup
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: testUserId,
              email: testEmail,
              user_metadata: { name: "Test User" },
            },
          },
        }),
      },
    }

    ;(getServerSupabase as jest.Mock).mockReturnValue(mockSupabase)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: testUserId,
      email: testEmail,
      name: "Test User",
      password: "",
    })

    const signupRequest = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        id: testUserId, // Signup route expects 'id' not 'userId'
        email: testEmail,
        name: "Test User",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    signupRequest.json = jest.fn().mockResolvedValue({
      id: testUserId,
      email: testEmail,
      name: "Test User",
    })

    const signupResponse = await signupPOST(signupRequest)
    const signupData = await signupResponse.json()

    // Check if signup was successful or if there's an error
    if (signupResponse.status !== 201) {
      console.log("Signup error:", signupData)
    }
    expect(signupResponse.status).toBe(201)
    expect(signupData.user?.email || signupData.email).toBe(testEmail)

    // Step 2: Login
    mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: testUserId,
          email: testEmail,
        },
        session: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      },
      error: null,
    })

    const loginRequest = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    loginRequest.json = jest.fn().mockResolvedValue({
      email: testEmail,
      password: testPassword,
    })

    const loginResponse = await loginPOST(loginRequest)
    const loginData = await loginResponse.json()

    expect(loginResponse.status).toBe(200)
    expect(loginData.user.email).toBe(testEmail)

    // Step 3: Get current user (me)
    const mockUser = createMockUser({
      id: testUserId,
      email: testEmail,
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: testUserId,
      email: testEmail,
      name: "Test User",
      password: "",
    })

    const meRequest = new NextRequest("http://localhost:3000/api/auth/me")
    const meResponse = await meGET(meRequest, mockUser)
    const meData = await meResponse.json()

    expect(meResponse.status).toBe(200)
    expect(meData.user.email).toBe(testEmail)

    // Step 4: Logout
    const mockLogoutSupabase = {
      auth: {
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    }
    ;(getServerSupabase as jest.Mock).mockReturnValue(mockLogoutSupabase)

    // Mock cookies
    const mockCookies = {
      set: jest.fn(),
      delete: jest.fn(),
    }
    const logoutRequest = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
    })

    const logoutResponse = await logoutPOST(logoutRequest, mockUser)
    const logoutData = await logoutResponse.json()

    expect(logoutResponse.status).toBe(200)
    expect(logoutData.message).toBe("Logged out successfully")
  })

  it("should handle failed login after successful signup", async () => {
    const testEmail = "test@example.com"
    const testUserId = "user-123"

    // Signup first
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: testUserId,
              email: testEmail,
            },
          },
        }),
      },
    }

    ;(getServerSupabase as jest.Mock).mockReturnValue(mockSupabase)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: testUserId,
      email: testEmail,
      name: "Test User",
      password: "",
    })

    const signupRequest = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        userId: testUserId,
        email: testEmail,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    signupRequest.json = jest.fn().mockResolvedValue({
      userId: testUserId,
      email: testEmail,
    })

    await signupPOST(signupRequest)

    // Attempt login with wrong password
    mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid credentials" },
    })

    const loginRequest = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPassword",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    loginRequest.json = jest.fn().mockResolvedValue({
      email: testEmail,
      password: "WrongPassword",
    })

    const loginResponse = await loginPOST(loginRequest)
    const loginData = await loginResponse.json()

    expect(loginResponse.status).toBe(401)
    expect(loginData.error).toBeDefined()
  })
})

