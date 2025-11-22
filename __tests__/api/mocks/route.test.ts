/**
 * Tests for /api/mocks route (GET and POST)
 */

import { GET, POST } from "@/app/api/mocks/route"
import { NextRequest } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { checkOrganizationAccess, canCreateMockInOrganization } from "@/lib/organization-auth"
import { validateAndSanitizeMockApiCreate } from "@/lib/input-security"
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
    mockApi: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock("@/lib/organization-auth", () => ({
  checkOrganizationAccess: jest.fn(),
  canCreateMockInOrganization: jest.fn(),
}))

jest.mock("@/lib/input-security", () => ({
  validateAndSanitizeMockApiCreate: jest.fn(),
}))

describe("GET /api/mocks", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return paginated mocks for user", async () => {
    const mockMocks = [
      {
        id: "mock-1",
        name: "Test Mock 1",
        endpoint: "/test",
        method: "GET",
        responseCode: 200,
        createdAt: new Date(),
        organizationId: null,
        organization: null,
      },
      {
        id: "mock-2",
        name: "Test Mock 2",
        endpoint: "/test2",
        method: "POST",
        responseCode: 201,
        createdAt: new Date(),
        organizationId: null,
        organization: null,
      },
    ]

    ;(prisma.mockApi.findMany as jest.Mock).mockResolvedValue(mockMocks)
    ;(prisma.mockApi.count as jest.Mock).mockResolvedValue(2)

    const request = new NextRequest("http://localhost:3000/api/mocks?page=1&limit=12")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.mocks).toHaveLength(2)
    expect(data.pagination).toEqual({
      page: 1,
      limit: 12,
      total: 2,
      totalPages: 1,
    })
  })

  it("should filter mocks by search query", async () => {
    const mockMocks = [
      {
        id: "mock-1",
        name: "Search Result",
        endpoint: "/search",
        method: "GET",
        responseCode: 200,
        createdAt: new Date(),
        organizationId: null,
        organization: null,
      },
    ]

    ;(prisma.mockApi.findMany as jest.Mock).mockResolvedValue(mockMocks)
    ;(prisma.mockApi.count as jest.Mock).mockResolvedValue(1)

    const request = new NextRequest("http://localhost:3000/api/mocks?search=search")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.mocks).toHaveLength(1)
    expect(prisma.mockApi.findMany).toHaveBeenCalled()
  })

  it("should filter mocks by method", async () => {
    ;(prisma.mockApi.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.mockApi.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/mocks?method=GET")
    await GET(request, mockUser)

    expect(prisma.mockApi.findMany).toHaveBeenCalled()
    const whereClause = (prisma.mockApi.findMany as jest.Mock).mock.calls[0][0].where
    expect(whereClause.method).toBe("GET")
  })

  it("should filter mocks by status code", async () => {
    ;(prisma.mockApi.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.mockApi.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/mocks?statusCode=200")
    await GET(request, mockUser)

    expect(prisma.mockApi.findMany).toHaveBeenCalled()
    const whereClause = (prisma.mockApi.findMany as jest.Mock).mock.calls[0][0].where
    expect(whereClause.responseCode).toBe(200)
  })

  it("should filter by personalOnly", async () => {
    ;(prisma.mockApi.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.mockApi.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/mocks?personalOnly=true")
    await GET(request, mockUser)

    expect(prisma.mockApi.findMany).toHaveBeenCalled()
    const whereClause = (prisma.mockApi.findMany as jest.Mock).mock.calls[0][0].where
    expect(whereClause.userId).toBe("user-123")
    expect(whereClause.organizationId).toBeNull()
  })

  it("should filter by organizationId and check access", async () => {
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: true,
      role: "member",
      isOwner: false,
      isAdmin: false,
      isMember: true,
    })
    ;(prisma.mockApi.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.mockApi.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/mocks?organizationId=org-123")
    await GET(request, mockUser)

    expect(checkOrganizationAccess).toHaveBeenCalledWith("user-123", "org-123")
    expect(prisma.mockApi.findMany).toHaveBeenCalled()
  })

  it("should return 404 if user doesn't have access to organization", async () => {
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: false,
      role: null,
      isOwner: false,
      isAdmin: false,
      isMember: false,
    })

    const request = new NextRequest("http://localhost:3000/api/mocks?organizationId=org-123")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Organization not found or access denied")
  })

  it("should sort mocks by name ascending", async () => {
    ;(prisma.mockApi.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.mockApi.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/mocks?sortBy=name&sortOrder=asc")
    await GET(request, mockUser)

    expect(prisma.mockApi.findMany).toHaveBeenCalled()
    const orderBy = (prisma.mockApi.findMany as jest.Mock).mock.calls[0][0].orderBy
    expect(orderBy.name).toBe("asc")
  })

  it("should sort mocks by createdAt descending (default)", async () => {
    ;(prisma.mockApi.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.mockApi.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/mocks")
    await GET(request, mockUser)

    expect(prisma.mockApi.findMany).toHaveBeenCalled()
    const orderBy = (prisma.mockApi.findMany as jest.Mock).mock.calls[0][0].orderBy
    expect(orderBy.createdAt).toBe("desc")
  })
})

describe("POST /api/mocks", () => {
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

  it("should create a personal mock successfully", async () => {
    const mockData = {
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: { message: "Success" },
    }

    ;(validateAndSanitizeMockApiCreate as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    })

    ;(prisma.mockApi.findFirst as jest.Mock).mockResolvedValue(null)

    const createdMock = {
      id: "mock-123",
      ...mockData,
      createdAt: new Date(),
      organization: null,
    }

    ;(prisma.mockApi.create as jest.Mock).mockResolvedValue(createdMock)

    const requestBody = mockData
    const request = new NextRequest("http://localhost:3000/api/mocks", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe("Mock API created successfully")
    expect(data.mock).toEqual(createdMock)
    expect(prisma.mockApi.create).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        organizationId: null,
        name: "Test Mock",
        endpoint: "/test",
        method: "GET",
        responseCode: 200,
        responseBody: { message: "Success" },
      },
      select: expect.any(Object),
    })
  })

  it("should create a mock in organization if user has permission", async () => {
    const mockData = {
      name: "Org Mock",
      endpoint: "/org/test",
      method: "POST",
      responseCode: 201,
      responseBody: { message: "Created" },
      organizationId: "org-123",
    }

    ;(validateAndSanitizeMockApiCreate as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    })

    ;(canCreateMockInOrganization as jest.Mock).mockResolvedValue(true)
    ;(prisma.mockApi.findFirst as jest.Mock).mockResolvedValue(null)

    const createdMock = {
      id: "mock-456",
      ...mockData,
      createdAt: new Date(),
      organization: {
        id: "org-123",
        name: "Test Org",
      },
    }

    ;(prisma.mockApi.create as jest.Mock).mockResolvedValue(createdMock)

    const requestBody = mockData
    const request = new NextRequest("http://localhost:3000/api/mocks", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.mock.organizationId).toBe("org-123")
    expect(canCreateMockInOrganization).toHaveBeenCalledWith("user-123", "org-123")
  })

  it("should return 403 if user doesn't have permission to create in organization", async () => {
    const mockData = {
      name: "Org Mock",
      endpoint: "/org/test",
      method: "POST",
      responseCode: 201,
      responseBody: { message: "Created" },
      organizationId: "org-123",
    }

    ;(validateAndSanitizeMockApiCreate as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    })

    ;(canCreateMockInOrganization as jest.Mock).mockResolvedValue(false)

    const requestBody = mockData
    const request = new NextRequest("http://localhost:3000/api/mocks", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("You don't have permission to create mocks in this organization")
  })

  it("should return 400 if validation fails", async () => {
    ;(validateAndSanitizeMockApiCreate as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        status: 400,
        json: () => Promise.resolve({ error: "Invalid input" }),
      },
    })

    const requestBody = {
      name: "",
      endpoint: "",
    }

    const request = new NextRequest("http://localhost:3000/api/mocks", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid input")
  })

  it("should return 400 if duplicate endpoint/method exists", async () => {
    const mockData = {
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: {},
    }

    ;(validateAndSanitizeMockApiCreate as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    })

    ;(prisma.mockApi.findFirst as jest.Mock).mockResolvedValue({
      id: "existing-mock",
      endpoint: "/test",
      method: "GET",
    })

    const requestBody = mockData
    const request = new NextRequest("http://localhost:3000/api/mocks", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("A mock with this endpoint and method already exists")
  })

  it("should auto-create user if missing from database", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    })

    const mockData = {
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: {},
    }

    ;(validateAndSanitizeMockApiCreate as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    })

    ;(prisma.mockApi.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.mockApi.create as jest.Mock).mockResolvedValue({
      id: "mock-123",
      ...mockData,
      createdAt: new Date(),
      organization: null,
    })

    const requestBody = mockData
    const request = new NextRequest("http://localhost:3000/api/mocks", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    await POST(request, mockUser)

    expect(prisma.user.create).toHaveBeenCalled()
  })
})

