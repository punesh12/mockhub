/**
 * Tests for /api/history route (GET)
 */

import { GET } from "@/app/api/history/route"
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
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}))

describe("GET /api/history", () => {
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

  it("should return paginated history for user", async () => {
    const mockHistory = [
      {
        id: "history-1",
        url: "https://api.example.com/test",
        method: "GET",
        status: 200,
        responseTime: 150,
        responseBody: { message: "Success" },
        createdAt: new Date(),
      },
      {
        id: "history-2",
        url: "https://api.example.com/test2",
        method: "POST",
        status: 201,
        responseTime: 200,
        responseBody: { message: "Created" },
        createdAt: new Date(),
      },
    ]

    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue(mockHistory)
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(2)
    ;(prisma.requestHistory.aggregate as jest.Mock).mockResolvedValue({
      _count: { id: 2 },
      _avg: { responseTime: 175 },
    })

    const request = new NextRequest("http://localhost:3000/api/history?page=1&limit=20")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.history).toHaveLength(2)
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    })
    expect(data.statistics).toBeDefined()
  })

  it("should filter history by method", async () => {
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/history?method=GET")
    await GET(request, mockUser)

    expect(prisma.requestHistory.findMany).toHaveBeenCalled()
    const whereClause = (prisma.requestHistory.findMany as jest.Mock).mock.calls[0][0].where
    expect(whereClause.method).toBe("GET")
  })

  it("should filter history by status code", async () => {
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/history?status=200")
    await GET(request, mockUser)

    expect(prisma.requestHistory.findMany).toHaveBeenCalled()
    const whereClause = (prisma.requestHistory.findMany as jest.Mock).mock.calls[0][0].where
    expect(whereClause.status).toBe(200)
  })

  it("should filter history by search query", async () => {
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/history?search=api.example.com")
    await GET(request, mockUser)

    expect(prisma.requestHistory.findMany).toHaveBeenCalled()
    const whereClause = (prisma.requestHistory.findMany as jest.Mock).mock.calls[0][0].where
    expect(whereClause.url).toEqual({
      contains: "api.example.com",
      mode: "insensitive",
    })
  })

  it("should filter history by date range", async () => {
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/history?startDate=2024-01-01&endDate=2024-01-31")
    await GET(request, mockUser)

    expect(prisma.requestHistory.findMany).toHaveBeenCalled()
    const whereClause = (prisma.requestHistory.findMany as jest.Mock).mock.calls[0][0].where
    expect(whereClause.createdAt).toBeDefined()
    expect(whereClause.createdAt.gte).toBeInstanceOf(Date)
    expect(whereClause.createdAt.lte).toBeInstanceOf(Date)
  })

  it("should sort history by createdAt descending (default)", async () => {
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/history")
    await GET(request, mockUser)

    expect(prisma.requestHistory.findMany).toHaveBeenCalled()
    const orderBy = (prisma.requestHistory.findMany as jest.Mock).mock.calls[0][0].orderBy
    expect(orderBy.createdAt).toBe("desc")
  })

  it("should sort history by responseTime ascending", async () => {
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/history?sortBy=responseTime&sortOrder=asc")
    await GET(request, mockUser)

    expect(prisma.requestHistory.findMany).toHaveBeenCalled()
    const orderBy = (prisma.requestHistory.findMany as jest.Mock).mock.calls[0][0].orderBy
    expect(orderBy.responseTime).toBe("asc")
  })

  it("should calculate statistics when no filters are applied", async () => {
    const mockHistory = [
      {
        id: "history-1",
        url: "https://api.example.com/test",
        method: "GET",
        status: 200,
        responseTime: 150,
        responseBody: {},
        createdAt: new Date(),
      },
    ]

    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue(mockHistory)
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.requestHistory.aggregate as jest.Mock).mockResolvedValue({
      _count: { id: 1 },
      _avg: { responseTime: 150 },
    })

    const request = new NextRequest("http://localhost:3000/api/history")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(data.statistics).toEqual({
      total: 1,
      successRate: 100,
      avgResponseTime: 150,
      successCount: 1,
      errorCount: 0,
    })
  })

  it("should not calculate statistics when filters are applied", async () => {
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/history?method=GET")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(data.statistics).toBeNull()
    expect(prisma.requestHistory.aggregate).not.toHaveBeenCalled()
  })

  it("should auto-create user if missing from database", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    })
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/history")
    await GET(request, mockUser)

    expect(prisma.user.create).toHaveBeenCalled()
  })

  it("should return 400 if user email is missing", async () => {
    const userWithoutEmail = createMockUser({
      id: "user-123",
      email: undefined,
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/history")
    const response = await GET(request, userWithoutEmail)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("User email is missing. Please log out and log in again.")
  })

  it("should support pagination", async () => {
    ;(prisma.requestHistory.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.requestHistory.count as jest.Mock).mockResolvedValue(50)

    const request = new NextRequest("http://localhost:3000/api/history?page=2&limit=10")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(prisma.requestHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    )
    expect(data.pagination.totalPages).toBe(5)
  })
})

