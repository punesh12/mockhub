/**
 * Tests for /api/organizations/[id]/members/[memberId] route (PUT and DELETE)
 */

import { PUT, DELETE } from "@/app/api/organizations/[id]/members/[memberId]/route"
import { NextRequest } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { canManageMembers } from "@/lib/organization-auth"
import { validateAndParse, getValidationErrorMessage, updateMemberRoleSchema } from "@/lib/validation"
import { createMockUser } from "@/tests/utils/mock-data"

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  withAuth: jest.fn((handler) => async (request: NextRequest, user: any, { params }: { params: Promise<{ id: string; memberId: string }> }) => {
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
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock("@/lib/organization-auth", () => ({
  canManageMembers: jest.fn(),
}))

jest.mock("@/lib/validation", () => ({
  validateAndParse: jest.fn(),
  getValidationErrorMessage: jest.fn((error) => error.message || "Validation error"),
  updateMemberRoleSchema: {},
}))

describe("PUT /api/organizations/[id]/members/[memberId]", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should update member role successfully", async () => {
    const member = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "member",
      organization: {
        ownerId: "user-123",
      },
    }

    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        role: "admin",
      },
    })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(member)

    const updatedMember = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "admin",
      createdAt: new Date(),
      user: {
        id: "user-456",
        name: "Member User",
        email: "member@example.com",
      },
    }

    ;(prisma.organizationMember.update as jest.Mock).mockResolvedValue(updatedMember)

    const requestBody = { role: "admin" }
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/member-456", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "member-456" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Member role updated successfully")
    expect(data.member.role).toBe("admin")
  })

  it("should return 404 if organization not found", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations/nonexistent/members/member-456", {
      method: "PUT",
    })

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "nonexistent", memberId: "member-456" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Organization not found")
  })

  it("should return 403 if user doesn't have permission to manage members", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/member-456", {
      method: "PUT",
    })

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "member-456" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("You don't have permission to manage members")
  })

  it("should return 404 if member not found", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: { role: "admin" },
    })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null)

    const requestBody = { role: "admin" }
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/nonexistent", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "nonexistent" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Member not found")
  })

  it("should return 400 if trying to change owner role", async () => {
    const member = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "owner",
      organization: {
        ownerId: "user-123",
      },
    }

    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: { role: "admin" },
    })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(member)

    const requestBody = { role: "admin" }
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/member-456", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "member-456" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Cannot change owner role")
  })

  it("should return 400 if trying to change organization owner's role", async () => {
    const member = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-123", // Same as owner
      role: "member",
      organization: {
        ownerId: "user-123",
      },
    }

    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: true,
      data: { role: "admin" },
    })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(member)

    const requestBody = { role: "admin" }
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/member-456", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "member-456" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Cannot change role of organization owner")
  })

  it("should return 400 if validation fails", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(validateAndParse as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: "Role is required" },
    })

    const requestBody = {}
    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/member-456", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await PUT(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "member-456" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Role is required")
  })
})

describe("DELETE /api/organizations/[id]/members/[memberId]", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should remove member successfully", async () => {
    const member = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "member",
      organization: {
        ownerId: "user-123",
      },
    }

    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(member)
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(prisma.organizationMember.delete as jest.Mock).mockResolvedValue(member)

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/member-456", {
      method: "DELETE",
    })

    const response = await DELETE(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "member-456" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Member removed successfully")
    expect(prisma.organizationMember.delete).toHaveBeenCalledWith({
      where: { id: "member-456" },
    })
  })

  it("should allow members to remove themselves", async () => {
    const member = {
      id: "member-123",
      organizationId: "org-123",
      userId: "user-123", // Same as current user
      role: "member",
      organization: {
        ownerId: "other-user",
      },
    }

    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(member)
    ;(prisma.organizationMember.delete as jest.Mock).mockResolvedValue(member)

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/member-123", {
      method: "DELETE",
    })

    const response = await DELETE(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "member-123" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Member removed successfully")
    // Should not check canManageMembers when removing self
    expect(canManageMembers).not.toHaveBeenCalled()
  })

  it("should return 404 if organization not found", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations/nonexistent/members/member-456", {
      method: "DELETE",
    })

    const response = await DELETE(request, mockUser, { params: Promise.resolve({ id: "nonexistent", memberId: "member-456" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Organization not found")
  })

  it("should return 404 if member not found", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/nonexistent", {
      method: "DELETE",
    })

    const response = await DELETE(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "nonexistent" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Member not found")
  })

  it("should return 403 if user doesn't have permission to remove other members", async () => {
    const member = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "member",
      organization: {
        ownerId: "other-user",
      },
    }

    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(member)
    ;(canManageMembers as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/member-456", {
      method: "DELETE",
    })

    const response = await DELETE(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "member-456" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("You don't have permission to remove members")
  })

  it("should return 400 if trying to remove owner", async () => {
    const member = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-123",
      role: "owner",
      organization: {
        ownerId: "user-123",
      },
    }

    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(member)

    const request = new NextRequest("http://localhost:3000/api/organizations/org-123/members/member-456", {
      method: "DELETE",
    })

    const response = await DELETE(request, mockUser, { params: Promise.resolve({ id: "org-123", memberId: "member-456" }) } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Cannot remove organization owner")
    expect(prisma.organizationMember.delete).not.toHaveBeenCalled()
  })

  it("should support slug-based organization lookup", async () => {
    const member = {
      id: "member-456",
      organizationId: "org-123",
      userId: "user-456",
      role: "member",
      organization: {
        ownerId: "user-123",
      },
    }

    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: "org-123" })
    ;(prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(member)
    ;(canManageMembers as jest.Mock).mockResolvedValue(true)
    ;(prisma.organizationMember.delete as jest.Mock).mockResolvedValue(member)

    const request = new NextRequest("http://localhost:3000/api/organizations/test-org/members/member-456", {
      method: "DELETE",
    })

    await DELETE(request, mockUser, { params: Promise.resolve({ id: "test-org", memberId: "member-456" }) } as any)

    expect(prisma.organization.findUnique).toHaveBeenCalledWith({
      where: { slug: "test-org" },
      select: { id: true },
    })
  })
})

