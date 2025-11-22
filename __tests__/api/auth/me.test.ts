/**
 * Tests for /api/auth/me route
 */

import { GET } from "@/app/api/auth/me/route"
import { NextRequest } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { createMockUser } from "@/tests/utils/mock-data"

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  withAuth: jest.fn((handler) => handler),
}))

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe("GET /api/auth/me", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
    user_metadata: {
      name: "Test User",
    },
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return user from database if exists", async () => {
    const dbUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      createdAt: new Date(),
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser)

    const request = new NextRequest("http://localhost:3000/api/auth/me")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toEqual(dbUser)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-123" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })
  })

  it("should return auth user if not in database", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/auth/me")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toEqual({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    })
  })

  it("should use email as name if user_metadata.name is not available", async () => {
    const userWithoutName = createMockUser({
      id: "user-456",
      email: "user@example.com",
      user_metadata: {},
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/auth/me")
    const response = await GET(request, userWithoutName)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.name).toBe("user@example.com")
  })
})

