/**
 * Tests for /api/organizations route (GET and POST)
 */

import { GET, POST } from "@/app/api/organizations/route"
import { NextRequest } from "next/server"
import { withAuth, withOptionalAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { generateUniqueSlug } from "@/lib/organization-auth"
import { validateAndSanitizeOrganizationCreate } from "@/lib/input-security"
import { createMockUser } from "@/tests/utils/mock-data"

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  withAuth: jest.fn((handler) => handler),
  withOptionalAuth: jest.fn((handler) => handler),
}))

jest.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    organizationMember: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock("@/lib/organization-auth", () => ({
  generateUniqueSlug: jest.fn(),
}))

jest.mock("@/lib/input-security", () => ({
  validateAndSanitizeOrganizationCreate: jest.fn(),
}))

describe("GET /api/organizations", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return user's organizations when authenticated", async () => {
    const mockOrganizations = [
      {
        id: "org-1",
        name: "Test Org 1",
        slug: "test-org-1",
        description: "Test description",
        visibility: "private" as const,
        ownerId: "user-123",
        createdAt: new Date(),
        owner: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
        members: [],
        _count: {
          members: 1,
          mocks: 5,
        },
      },
    ]

    ;(prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrganizations)
    ;(prisma.organization.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.organizations).toHaveLength(1)
    expect(data.organizations[0].userRole).toBe("owner")
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    })
  })

  it("should return 401 if not authenticated and not requesting public orgs", async () => {
    const request = new NextRequest("http://localhost:3000/api/organizations")
    const response = await GET(request, null)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe("Authentication required")
  })

  it("should return public organizations when public=true", async () => {
    const mockOrganizations = [
      {
        id: "org-1",
        name: "Public Org",
        slug: "public-org",
        description: "Public organization",
        visibility: "public" as const,
        ownerId: "other-user",
        createdAt: new Date(),
        owner: {
          id: "other-user",
          name: "Other User",
          email: "other@example.com",
        },
        _count: {
          members: 5,
          mocks: 10,
        },
      },
    ]

    ;(prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrganizations)
    ;(prisma.organization.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations?public=true")
    const response = await GET(request, null)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.organizations).toHaveLength(1)
    expect(data.organizations[0].visibility).toBe("public")
  })

  it("should filter organizations by search query", async () => {
    ;(prisma.organization.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.organization.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/organizations?search=test")
    await GET(request, mockUser)

    expect(prisma.organization.findMany).toHaveBeenCalled()
    const whereClause = (prisma.organization.findMany as jest.Mock).mock.calls[0][0].where
    expect(whereClause.AND).toBeDefined()
  })

  it("should filter organizations by visibility", async () => {
    ;(prisma.organization.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.organization.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest("http://localhost:3000/api/organizations?visibility=public")
    await GET(request, mockUser)

    expect(prisma.organization.findMany).toHaveBeenCalled()
    const whereClause = (prisma.organization.findMany as jest.Mock).mock.calls[0][0].where
    expect(whereClause.visibility).toBe("public")
  })

  it("should support pagination", async () => {
    ;(prisma.organization.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.organization.count as jest.Mock).mockResolvedValue(50)

    const request = new NextRequest("http://localhost:3000/api/organizations?page=2&limit=10")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(prisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    )
    expect(data.pagination.totalPages).toBe(5)
  })

  it("should include user role for authenticated requests", async () => {
    const mockOrganizations = [
      {
        id: "org-1",
        name: "Test Org",
        slug: "test-org",
        visibility: "private" as const,
        ownerId: "user-123",
        createdAt: new Date(),
        owner: { id: "user-123", name: "Test", email: "test@example.com" },
        members: [],
        _count: { members: 1, mocks: 0 },
      },
    ]

    ;(prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrganizations)
    ;(prisma.organization.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations")
    const response = await GET(request, mockUser)
    const data = await response.json()

    expect(data.organizations[0].userRole).toBe("owner")
  })
})

describe("POST /api/organizations", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should create organization successfully", async () => {
    const orgData = {
      name: "New Organization",
      description: "Test description",
      visibility: "private" as const,
    }

    ;(validateAndSanitizeOrganizationCreate as jest.Mock).mockResolvedValue({
      success: true,
      data: orgData,
    })

    ;(generateUniqueSlug as jest.Mock).mockResolvedValue("new-organization")

    const createdOrg = {
      id: "org-123",
      name: "New Organization",
      slug: "new-organization",
      description: "Test description",
      visibility: "private" as const,
      ownerId: "user-123",
      createdAt: new Date(),
      owner: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      },
      members: [
        {
          id: "member-1",
          userId: "user-123",
          role: "owner",
          user: {
            id: "user-123",
            name: "Test User",
            email: "test@example.com",
          },
        },
      ],
      _count: {
        members: 1,
        mocks: 0,
      },
    }

    ;(prisma.organization.create as jest.Mock).mockResolvedValue(createdOrg)

    const requestBody = orgData
    const request = new NextRequest("http://localhost:3000/api/organizations", {
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
    expect(data.message).toBe("Organization created successfully")
    expect(data.organization.name).toBe("New Organization")
    expect(data.organization.userRole).toBe("owner")
    expect(prisma.organization.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "New Organization",
        ownerId: "user-123",
        members: {
          create: {
            userId: "user-123",
            role: "owner",
          },
        },
      }),
      include: expect.any(Object),
    })
  })

  it("should return 400 if validation fails", async () => {
    ;(validateAndSanitizeOrganizationCreate as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        status: 400,
        json: () => Promise.resolve({ error: "Name is required" }),
      },
    })

    const requestBody = { name: "" }
    const request = new NextRequest("http://localhost:3000/api/organizations", {
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
    expect(data.error).toBe("Name is required")
  })

  it("should generate unique slug from name", async () => {
    const orgData = {
      name: "My Organization",
      description: "Test",
      visibility: "public" as const,
    }

    ;(validateAndSanitizeOrganizationCreate as jest.Mock).mockResolvedValue({
      success: true,
      data: orgData,
    })

    ;(generateUniqueSlug as jest.Mock).mockResolvedValue("my-organization")

    ;(prisma.organization.create as jest.Mock).mockResolvedValue({
      id: "org-123",
      ...orgData,
      slug: "my-organization",
      ownerId: "user-123",
      createdAt: new Date(),
      owner: { id: "user-123", name: "Test", email: "test@example.com" },
      members: [],
      _count: { members: 1, mocks: 0 },
    })

    const requestBody = orgData
    const request = new NextRequest("http://localhost:3000/api/organizations", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    await POST(request, mockUser)

    expect(generateUniqueSlug).toHaveBeenCalledWith("My Organization")
  })

  it("should create owner member record", async () => {
    const orgData = {
      name: "Test Org",
      visibility: "private" as const,
    }

    ;(validateAndSanitizeOrganizationCreate as jest.Mock).mockResolvedValue({
      success: true,
      data: orgData,
    })

    ;(generateUniqueSlug as jest.Mock).mockResolvedValue("test-org")

    ;(prisma.organization.create as jest.Mock).mockResolvedValue({
      id: "org-123",
      ...orgData,
      slug: "test-org",
      ownerId: "user-123",
      createdAt: new Date(),
      owner: { id: "user-123", name: "Test", email: "test@example.com" },
      members: [
        {
          id: "member-1",
          userId: "user-123",
          role: "owner",
          user: { id: "user-123", name: "Test", email: "test@example.com" },
        },
      ],
      _count: { members: 1, mocks: 0 },
    })

    const requestBody = orgData
    const request = new NextRequest("http://localhost:3000/api/organizations", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    await POST(request, mockUser)

    expect(prisma.organization.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        members: {
          create: {
            userId: "user-123",
            role: "owner",
          },
        },
      }),
      include: expect.any(Object),
    })
  })
})

