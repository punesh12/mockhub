/**
 * Tests for /api/auth/signup route
 */

import { POST } from "@/app/api/auth/signup/route"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateAndSanitizeSignup } from "@/lib/input-security"
import { rateLimitCheck } from "@/lib/rate-limit"

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock("@/lib/input-security", () => ({
  validateAndSanitizeSignup: jest.fn(),
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

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: no rate limit
    ;(rateLimitCheck as jest.Mock).mockReturnValue(null)
  })

  it("should create a new user successfully", async () => {
    const mockUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      createdAt: new Date(),
    }

    ;(validateAndSanitizeSignup as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        name: "Test User",
        email: "test@example.com",
      },
    })

    ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

    const requestBody = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    // Mock json() method
    request.json = jest.fn().mockResolvedValue(requestBody) as jest.Mock

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe("User created successfully in database")
    expect(data.user).toEqual(mockUser)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })
  })

  it("should return 400 if user ID is missing", async () => {
    const requestBody = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody) as jest.Mock

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("User ID is required")
  })

  it("should return 400 if validation fails", async () => {
    ;(validateAndSanitizeSignup as jest.Mock).mockResolvedValue({
      success: false,
      error: NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      ),
    })

    const requestBody = {
      id: "user-123",
      name: "Test User",
      email: "invalid-email",
      password: "password123",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody) as jest.Mock

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid email format")
  })

  it("should return 200 if user already exists", async () => {
    const existingUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      createdAt: new Date(),
    }

    ;(validateAndSanitizeSignup as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        name: "Test User",
        email: "test@example.com",
      },
    })

    ;(prisma.user.create as jest.Mock).mockRejectedValue({
      code: "P2002",
      message: "Unique constraint failed",
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

    const requestBody = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody) as jest.Mock

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("User already exists")
    expect(data.user).toEqual(existingUser)
  })

  it("should return 429 if rate limit is exceeded", async () => {
    ;(rateLimitCheck as jest.Mock).mockReturnValue(
      NextResponse.json(
        { error: "Too many authentication attempts" },
        { status: 429 }
      )
    )

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
    }) as NextRequest & { json: jest.Mock }

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe("Too many authentication attempts")
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it("should return 500 on database error", async () => {
    ;(validateAndSanitizeSignup as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        name: "Test User",
        email: "test@example.com",
      },
    })

    ;(prisma.user.create as jest.Mock).mockRejectedValue(
      new Error("Database connection failed")
    )

    const requestBody = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    }

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody) as jest.Mock

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Failed to create user record")
  })
})

