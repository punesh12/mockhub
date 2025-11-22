/**
 * Tests for /api/organizations/[id]/members route (GET and POST)
 */

import { GET, POST } from "@/app/api/organizations/[id]/members/route"
import { NextRequest } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { checkOrganizationAccess, canManageMembers } from "@/lib/organization-auth"
import { validateAndSanitizeInviteMember } from "@/lib/input-security"
import { createMockUser } from "@/tests/utils/mock-data"

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  withAuth: jest.fn((handler) => async (request: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params
    return handler(request, user, { params: Promise.resolve(resolvedParams) })
  }),
}))

jest.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
    },
    organizationMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock("@/lib/organization-auth", () => ({
  checkOrganizationAccess: jest.fn(),
  canManageMembers: jest.fn(),
}))

jest.mock("@/lib/input-security", () => ({
  validateAndSanitizeInviteMember: jest.fn(),
}))

describe("GET /api/organizations/[id]/members", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return organization members", async () => {
    const mockMembers = [
      {
        id: "member-1",
        organizationId: "org-123",
        userId: "user-123",
        role: "owner",
        createdAt: new Date(),
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
      },
      {
        id: "member-2",
        organizationId: "org-123",
        userId: "user-456",
        role: "member",
        createdAt: new Date(),
        user: {
          id: "user-456",
          name: "Member User",
          email: "member@example.com",
        },
      },
    ]

    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: true,
      role: "owner",
      isOwner: true,
      isAdmin: true,
      isMember: true,
    })
    ;(prisma.organizationMember.findMany as jest.Mock).mockResolvedValue(mockMembers)

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members")
    const response = await GET(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.members).toHaveLength(2)
    expect(data.members[0].role).toBe("owner")
  })

  it("should return 404 if organization not found", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations/nonexistent/members")
    const response = await GET(request, mockUser, { params: Promise.resolve({ id: "nonexistent" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Organization not found")
  })

  it("should return 404 if user doesn't have access", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: false,
      role: null,
      isOwner: false,
      isAdmin: false,
      isMember: false,
    })

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members")
    const response = await GET(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Organization not found or access denied")
  })

  it("should support slug-based lookup", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(checkOrganizationAccess as jest.Mock).mockResolvedValue({
      hasAccess: true,
      role: "member",
      isOwner: false,
      isAdmin: false,
      isMember: true,
    })
    ;(prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest("http://localhost:3000/api/organizations/test-org/members")
    await GET(request, mockUser, { params: Promise.resolve({ id: "test-org" }) } as any)

    expect(prisma.organization.findUnique).toHaveBeenCalledWith({
      where: { slug: "test-org" },
      select: { id: true },
    })
  })
})

describe("POST /api/organizations/[id]/members", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should add member successfully", async () => {
    const memberData = {
      email: "newmember@example.com",
      role: "member" as const,
    }

    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndSanitizeInviteMember as jest.Mock).mockResolvedValue({
      success: true,
      data: memberData,
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-456",
      email: "newmember@example.com",
      name: "New Member",
    })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null)

    const createdMember = {
      id: "member-123",
      organizationId: "org-123",
      userId: "user-456",
      role: "member",
      createdAt: new Date(),
      user: {
        id: "user-456",
        name: "New Member",
        email: "newmember@example.com",
      },
    }

    ;(prisma.organizationMember.create as jest.Mock).mockResolvedValue(createdMember)

    const requestBody = memberData
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe("Member added successfully")
    expect(data.member.role).toBe("member")
    expect(prisma.organizationMember.create).toHaveBeenCalledWith({
      data: {
        organizationId: "org-123",
        userId: "user-456",
        role: "member",
      },
      include: expect.any(Object),
    })
  })

  it("should return 404 if organization not found", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations/nonexistent/members", {
      method: "POST",
    })

    const response = await POST(request, mockUser, { params: Promise.resolve({ id: "nonexistent" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Organization not found")
  })

  it("should return 403 if user doesn't have permission to manage members", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members", {
      method: "POST",
    })

    const response = await POST(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("You don't have permission to manage members")
  })

  it("should return 400 if validation fails", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndSanitizeInviteMember as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        status: 400,
        json: () => Promise.resolve({ error: "Email is required" }),
      },
    })

    const requestBody = { email: "" }
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Email is required")
  })

  it("should return 404 if user with email not found", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndSanitizeInviteMember as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "nonexistent@example.com",
        role: "member" as const,
      },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const requestBody = {
      email: "nonexistent@example.com",
      role: "member",
    }
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("User with this email not found")
  })

  it("should return 400 if user is already a member", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndSanitizeInviteMember as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "existing@example.com",
        role: "member" as const,
      },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-456",
      email: "existing@example.com",
    })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue({
      id: "member-123",
      organizationId: "org-123",
      userId: "user-456",
      role: "member",
    })

    const requestBody = {
      email: "existing@example.com",
      role: "member",
    }
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("User is already a member of this organization")
  })

  it("should return 400 if user tries to add themselves", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndSanitizeInviteMember as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "test@example.com",
        role: "member" as const,
      },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
    })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null)

    const requestBody = {
      email: "test@example.com",
      role: "member",
    }
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("You are already a member of this organization")
  })

  it("should return 400 if role is invalid", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndSanitizeInviteMember as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        email: "newmember@example.com",
        role: "owner" as any,
      },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-456",
      email: "newmember@example.com",
    })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null)

    const requestBody = {
      email: "newmember@example.com",
      role: "owner",
    }
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await POST(request, mockUser, { params: Promise.resolve({ id: "org-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Role must be 'admin' or 'member'")
  })
})

