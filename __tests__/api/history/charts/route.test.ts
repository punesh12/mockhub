/**
 * Tests for /api/history/charts route (GET)
 */

import { GET } from "@/app/api/history/charts/route"
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
      create: jest.fn(),
    },
    requestHistory: {
      findMany: jest.fn(),
    },
  },
}))

describe("GET /api/history/charts", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    })
  })

  it("should return chart data for last 30 days", async () => {
    const mockHistory = [
      {
        status: 200,
        responseTime: 150,
        createdAt: new Date("2024-01-15"),
      },
      {
        status: 201,
        responseTime: 200,
        createdAt: new Date("2024-01-15"),
      },
      {
        status: 404,
        responseTime: 50,
        createdAt: new Date("2024-01-16"),
      },
    ]

    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue(mockHistory)

    const request = new NextRequest("http://localhost:3000/api/history/charts")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.responseTime).toBeDefined()
    expect(data.requestVolume).toBeDefined()
    expect(data.statusCode).toBeDefined()
    expect(Array.isArray(data.responseTime)).toBe(true)
    expect(Array.isArray(data.requestVolume)).toBe(true)
    expect(Array.isArray(data.statusCode)).toBe(true)
  })

  it("should filter history to last 30 days", async () => {
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest("http://localhost:3000/api/history/charts")
    await GET(request, mockUser)

    expect(prisma.requestHistory.findMany).toHaveBeenCalled()
    const whereClause = (prisma.requestHistory.findMany as jest.Mock).mock.calls[0][0].where
    expect(whereClause.userId).toBe("user-123")
    expect(whereClause.createdAt.gte).toBeInstanceOf(Date)
  })

  it("should calculate response time data correctly", async () => {
    const mockHistory = [
      {
        status: 200,
        responseTime: 100,
        createdAt: new Date("2024-01-15"),
      },
      {
        status: 200,
        responseTime: 200,
        createdAt: new Date("2024-01-15"),
      },
    ]

    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue(mockHistory)

    const request = new NextRequest("http://localhost:3000/api/history/charts")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(data.responseTime.length).toBeGreaterThan(0)
    expect(data.responseTime[0].avgResponseTime).toBe(150)
    expect(data.responseTime[0].minResponseTime).toBe(100)
    expect(data.responseTime[0].maxResponseTime).toBe(200)
  })

  it("should calculate request volume data correctly", async () => {
    const sameDate = new Date("2024-01-15T12:00:00Z")
    const mockHistory = [
      {
        status: 200,
        responseTime: 150,
        createdAt: sameDate,
      },
      {
        status: 201,
        responseTime: 200,
        createdAt: sameDate,
      },
      {
        status: 404,
        responseTime: 50,
        createdAt: sameDate,
      },
    ]

    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue(mockHistory)

    const request = new NextRequest("http://localhost:3000/api/history/charts")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(data.requestVolume.length).toBeGreaterThan(0)
    const volumeData = data.requestVolume[0]
    expect(volumeData).toBeDefined()
    expect(volumeData).toHaveProperty("date")
    expect(volumeData).toHaveProperty("requests")
    expect(volumeData).toHaveProperty("successful")
    expect(volumeData).toHaveProperty("failed")
    expect(volumeData.requests).toBe(3)
    expect(volumeData.successful).toBe(2)
    expect(volumeData.failed).toBe(1)
  })

  it("should calculate status code distribution correctly", async () => {
    const mockHistory = [
      {
        status: 200,
        responseTime: 150,
        createdAt: new Date("2024-01-15"),
      },
      {
        status: 200,
        responseTime: 200,
        createdAt: new Date("2024-01-15"),
      },
      {
        status: 404,
        responseTime: 50,
        createdAt: new Date("2024-01-15"),
      },
      {
        status: 500,
        responseTime: 100,
        createdAt: new Date("2024-01-15"),
      },
    ]

    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue(mockHistory)

    const request = new NextRequest("http://localhost:3000/api/history/charts")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(data.statusCode.length).toBe(3)
    const status200 = data.statusCode.find((s: any) => s.status === "200")
    const status404 = data.statusCode.find((s: any) => s.status === "404")
    const status500 = data.statusCode.find((s: any) => s.status === "500")

    expect(status200).toBeDefined()
    expect(status404).toBeDefined()
    expect(status500).toBeDefined()
    expect(status200.count).toBe(2)
    expect(status404.count).toBe(1)
    expect(status500.count).toBe(1)
  })

  it("should sort status codes in ascending order", async () => {
    const mockHistory = [
      {
        status: 500,
        responseTime: 100,
        createdAt: new Date("2024-01-15"),
      },
      {
        status: 200,
        responseTime: 150,
        createdAt: new Date("2024-01-15"),
      },
      {
        status: 404,
        responseTime: 50,
        createdAt: new Date("2024-01-15"),
      },
    ]

    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue(mockHistory)

    const request = new NextRequest("http://localhost:3000/api/history/charts")
    const response = await GET(request, mockUser)
    const data = await response.json()

    const statusCodes = data.statusCode.map((s: any) => parseInt(s.status))
    expect(statusCodes).toEqual([200, 404, 500])
  })

  it("should auto-create user if missing from database", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    })
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest("http://localhost:3000/api/history/charts")
    await GET(request, mockUser)

    expect(prisma.user.create).toHaveBeenCalled()
  })

  it("should return 400 if user email is missing", async () => {
    const userWithoutEmail = createMockUser({
      id: "user-123",
      email: undefined,
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/history/charts")
    const response = await GET(request, userWithoutEmail)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("User email is missing. Please log out and log in again.")
  })

  it("should handle empty history gracefully", async () => {
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest("http://localhost:3000/api/history/charts")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.responseTime).toEqual([])
    expect(data.requestVolume).toEqual([])
    expect(data.statusCode).toEqual([])
  })
})

