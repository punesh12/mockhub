/**
 * Tests for /api/organizations/[id] route (GET, PUT, DELETE)
 */

import { GET, PUT, DELETE } from "@/app/api/organizations/[id]/route"
import { NextRequest } from "next/server"
import { withAuth, withOptionalAuthParams } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import {
  checkOrganizationAccess,
  canEditOrganization,
  canDeleteOrganization,
  generateUniqueSlug,
} from "@/lib/organization-auth"
import { validateAndSanitizeOrganizationUpdate } from "@/lib/input-security"
import { createMockUser } from "@/tests/utils/mock-data"

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  withAuth: jest.fn((handler) => async (request: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params
    return handler(request, user, { params: Promise.resolve(resolvedParams) })
  }),
  withOptionalAuthParams: jest.fn((handler) => async (request: NextRequest, { params }: { params: Promise<{ id: string }> }, user?: any) => {
    const resolvedParams = await params
    return handler(request, resolvedParams, user || null)
  }),
}))

jest.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock("@/lib/organization-auth", () => ({
  checkOrganizationAccess: jest.fn(),
  canEditOrganization: jest.fn(),
  canDeleteOrganization: jest.fn(),
  generateUniqueSlug: jest.fn(),
}))

jest.mock("@/lib/input-security", () => ({
  validateAndSanitizeOrganizationUpdate: jest.fn(),
}))

describe("GET /api/organizations/[id]", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return public organization without authentication", async () => {
    const mockOrg = {
      id: "org-123",
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
      members: [],
      _count: {
        members: 5,
        mocks: 10,
      },
    }

    ;(prisma.organization.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "org-123", visibility: "public" })
      .mockResolvedValueOnce(mockOrg)
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: true,
      role: null,
      isOwner: false,
      isAdmin: false,
      isMember: false,
    })

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123")
    const response = await GET(request, { params: Promise.resolve({ id: "org-123" }) }, null)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.organization.name).toBe("Public Org")
    expect(data.organization.userRole).toBeNull()
  })

  it("should return organization by UUID", async () => {
    const mockOrg = {
      id: "org-123",
      name: "Test Org",
      slug: "test-org",
      visibility: "private" as const,
      ownerId: "user-123",
      createdAt: new Date(),
      owner: { id: "user-123", name: "Test", email: "test@example.com" },
      members: [],
      _count: { members: 1, mocks: 0 },
    }

    ;(prisma.organization.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "org-123", visibility: "private" })
      .mockResolvedValueOnce(mockOrg)
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: true,
      role: "owner",
      isOwner: true,
      isAdmin: true,
      isMember: true,
    })

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123")
    const response = await GET(request, { params: Promise.resolve({ id: "org-123" }) }, mockUser)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.organization.userRole).toBe("owner")
  })

  it("should return organization by slug", async () => {
    const mockOrg = {
      id: "org-123",
      name: "Test Org",
      slug: "test-org",
      visibility: "private" as const,
      ownerId: "user-123",
      createdAt: new Date(),
      owner: { id: "user-123", name: "Test", email: "test@example.com" },
      members: [],
      _count: { members: 1, mocks: 0 },
    }

    ;(prisma.organization.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "org-123", visibility: "private" })
      .mockResolvedValueOnce(mockOrg)
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: true,
      role: "owner",
      isOwner: true,
      isAdmin: true,
      isMember: true,
    })

    const request = new NextRequest("http://localhost:3000/api/organizations/test-org")
    const response = await GET(request, { params: Promise.resolve({ id: "test-org" }) }, mockUser)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.organization.findUnique).toHaveBeenCalledWith({
      where: { slug: "test-org" },
      select: { id: true, visibility: true },
    })
  })

  it("should return 404 if organization not found", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations/nonexistent")
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) }, null)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Organization not found")
  })

  it("should return 401 for private organization without authentication", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      visibility: "private",
    })

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123")
    const response = await GET(request, { params: Promise.resolve({ id: "org-123" }) }, null)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe("Authentication required")
  })

  it("should return 404 if user doesn't have access to private organization", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      visibility: "private",
    })
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: false,
      role: null,
      isOwner: false,
      isAdmin: false,
      isMember: false,
    })

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123")
    const response = await GET(request, { params: Promise.resolve({ id: "org-123" }) }, mockUser)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Organization not found or access denied")
  })
})

describe("PUT /api/organizations/[id]", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should update organization successfully", async () => {
    const existingOrg = {
      id: "org-123",
      name: "Old Name",
      slug: "old-name",
      description: "Old description",
      visibility: "private" as const,
      ownerId: "user-123",
    }

    const updateData = {
      name: "New Name",
      description: "New description",
      visibility: "public" as const,
    }

    ;(prisma.organization.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "org-123" })
      .mockResolvedValueOnce(existingOrg)
    ;(canEditOrganization as jest.Mock).mockResolvedValue(true)
    ;(validateAndSanitizeOrganizationUpdate as jest.Mock).mockResolvedValue({
      success: true,
      data: updateData,
    })
    ;(generateUniqueSlug as jest.Mock).mockResolvedValue("new-name")
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: true,
      role: "owner",
      isOwner: true,
      isAdmin: true,
      isMember: true,
    })

    const updatedOrg = {
      id: "org-123",
      ...updateData,
      slug: "new-name",
      ownerId: "user-123",
      createdAt: new Date(),
      owner: { id: "user-123", name: "Test", email: "test@example.com" },
      members: [],
      _count: { members: 1, mocks: 0 },
    }

    ;(prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrg)

    const requestBody = updateData
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Organization updated successfully")
    expect(data.organization.name).toBe("New Name")
    expect(generateUniqueSlug).toHaveBeenCalledWith("New Name")
  })

  it("should return 404 if organization not found", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations/nonexistent", {
      method: "PUT",
    })

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "nonexistent" }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Organization not found")
  })

  it("should return 403 if user doesn't have edit permission", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canEditOrganization as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123", {
      method: "PUT",
    })

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("You don't have permission to edit this organization")
  })

  it("should return 400 if validation fails", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canEditOrganization as jest.Mock).mockResolvedValue(true)
    ;(validateAndSanitizeOrganizationUpdate as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        status: 400,
        json: () => Promise.resolve({ error: "Invalid input" }),
      },
    })

    const requestBody = { name: "" }
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid input")
  })

  it("should not regenerate slug if name hasn't changed", async () => {
    const existingOrg = {
      id: "org-123",
      name: "Test Org",
      slug: "test-org",
      description: "Description",
      visibility: "private" as const,
      ownerId: "user-123",
    }

    const updateData = {
      description: "New description",
    }

    ;(prisma.organization.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "org-123" })
      .mockResolvedValueOnce(existingOrg)
    ;(canEditOrganization as jest.Mock).mockResolvedValue(true)
    ;(validateAndSanitizeOrganizationUpdate as jest.Mock).mockResolvedValue({
      success: true,
      data: updateData,
    })
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: true,
      role: "owner",
      isOwner: true,
      isAdmin: true,
      isMember: true,
    })

    const updatedOrg = {
      ...existingOrg,
      description: "New description",
      createdAt: new Date(),
      owner: { id: "user-123", name: "Test", email: "test@example.com" },
      members: [],
      _count: { members: 1, mocks: 0 },
    }

    ;(prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrg)

    const requestBody = updateData
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    await PUT(request, mockUser, { params: Promise.resolve({ id: "org-123" }) })

    expect(generateUniqueSlug).not.toHaveBeenCalled()
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-123" },
      data: expect.objectContaining({
        description: "New description",
      }),
      include: expect.any(Object),
    })
  })
})

describe("DELETE /api/organizations/[id]", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should delete organization successfully if user is owner", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canDeleteOrganization as jest.Mock).mockResolvedValue(true)
    ;(prisma.organization.delete as jest.Mock).mockResolvedValue({})

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123", {
      method: "DELETE",
    })

    const response = await DELETE(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Organization deleted successfully")
    expect(prisma.organization.delete).toHaveBeenCalledWith({
      where: { id: "org-123" },
    })
  })

  it("should return 404 if organization not found", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations/nonexistent", {
      method: "DELETE",
    })

    const response = await DELETE(request, mockUser, { params: Promise.resolve({ id: "nonexistent" }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Organization not found")
  })

  it("should return 403 if user is not owner", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canDeleteOrganization as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123", {
      method: "DELETE",
    })

    const response = await DELETE(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("Only the organization owner can delete it")
    expect(prisma.organization.delete).not.toHaveBeenCalled()
  })

  it("should support slug-based deletion", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canDeleteOrganization as jest.Mock).mockResolvedValue(true)
    ;(prisma.organization.delete as jest.Mock).mockResolvedValue({})

    const request = new NextRequest("http://localhost:3000/api/organizations/test-org", {
      method: "DELETE",
    })

    await DELETE(request, mockUser, { params: Promise.resolve({ id: "test-org" }) })

    expect(prisma.organization.findUnique).toHaveBeenCalledWith({
      where: { slug: "test-org" },
      select: { id: true },
    })
  })
})

