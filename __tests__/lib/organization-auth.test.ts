/**
 * Tests for organization-auth utility
 */

import {
  generateSlug,
  generateUniqueSlug,
  checkOrganizationAccess,
  getUserOrganizationRole,
  checkOrganizationPermission,
  canEditOrganization,
  canManageMembers,
  canDeleteOrganization,
  canCreateMockInOrganization,
} from "@/lib/organization-auth"
import { prisma } from "@/lib/prisma"

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
    },
  },
}))

describe("generateSlug", () => {
  it("should convert name to lowercase slug", () => {
    expect(generateSlug("My Organization")).toBe("my-organization")
  })

  it("should remove special characters", () => {
    expect(generateSlug("Org@#$%Name")).toBe("orgname")
  })

  it("should replace spaces with hyphens", () => {
    expect(generateSlug("My Test Org")).toBe("my-test-org")
  })

  it("should handle multiple spaces", () => {
    expect(generateSlug("My   Test    Org")).toBe("my-test-org")
  })

  it("should remove leading and trailing hyphens", () => {
    expect(generateSlug("---My Org---")).toBe("my-org")
  })

  it("should handle multiple consecutive hyphens", () => {
    expect(generateSlug("My---Test---Org")).toBe("my-test-org")
  })

  it("should trim whitespace", () => {
    expect(generateSlug("  My Org  ")).toBe("my-org")
  })

  it("should handle empty string", () => {
    expect(generateSlug("")).toBe("")
  })
})

describe("generateUniqueSlug", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should generate unique slug when no duplicates exist", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const slug = await generateUniqueSlug("My Organization")

    expect(slug).toBe("my-organization")
    expect(prisma.organization.findUnique).toHaveBeenCalledWith({
      where: { slug: "my-organization" },
    })
  })

  it("should append counter when duplicate exists", async () => {
    ;(prisma.organization.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "org-1" }) // First call - exists
      .mockResolvedValueOnce(null) // Second call - doesn't exist

    const slug = await generateUniqueSlug("My Organization")

    expect(slug).toBe("my-organization-1")
    expect(prisma.organization.findUnique).toHaveBeenCalledTimes(2)
  })

  it("should increment counter for multiple duplicates", async () => {
    ;(prisma.organization.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "org-1" })
      .mockResolvedValueOnce({ id: "org-2" })
      .mockResolvedValueOnce(null)

    const slug = await generateUniqueSlug("My Organization")

    expect(slug).toBe("my-organization-2")
    expect(prisma.organization.findUnique).toHaveBeenCalledTimes(3)
  })
})

describe("checkOrganizationAccess", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return no access for non-existent organization", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const access = await checkOrganizationAccess("user-123", "org-123")

    expect(access.hasAccess).toBe(false)
    expect(access.role).toBeNull()
    expect(access.isOwner).toBe(false)
    expect(access.isAdmin).toBe(false)
    expect(access.isMember).toBe(false)
  })

  it("should return owner access for organization owner", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "user-123",
      visibility: "private",
      members: [],
    })

    const access = await checkOrganizationAccess("user-123", "org-123")

    expect(access.hasAccess).toBe(true)
    expect(access.role).toBe("owner")
    expect(access.isOwner).toBe(true)
    expect(access.isAdmin).toBe(true)
    expect(access.isMember).toBe(true)
  })

  it("should return member access for organization member", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [
        {
          userId: "user-123",
          role: "member",
        },
      ],
    })

    const access = await checkOrganizationAccess("user-123", "org-123")

    expect(access.hasAccess).toBe(true)
    expect(access.role).toBe("member")
    expect(access.isOwner).toBe(false)
    expect(access.isAdmin).toBe(false)
    expect(access.isMember).toBe(true)
  })

  it("should return admin access for organization admin", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [
        {
          userId: "user-123",
          role: "admin",
        },
      ],
    })

    const access = await checkOrganizationAccess("user-123", "org-123")

    expect(access.hasAccess).toBe(true)
    expect(access.role).toBe("admin")
    expect(access.isOwner).toBe(false)
    expect(access.isAdmin).toBe(true)
    expect(access.isMember).toBe(true)
  })

  it("should return access for public organization without membership", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "public",
      members: [],
    })

    const access = await checkOrganizationAccess("user-123", "org-123")

    expect(access.hasAccess).toBe(true)
    expect(access.role).toBeNull()
    expect(access.isOwner).toBe(false)
    expect(access.isAdmin).toBe(false)
    expect(access.isMember).toBe(false)
  })

  it("should return no access for private organization without membership", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [],
    })

    const access = await checkOrganizationAccess("user-123", "org-123")

    expect(access.hasAccess).toBe(false)
    expect(access.role).toBeNull()
  })
})

describe("getUserOrganizationRole", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return user role", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "user-123",
      visibility: "private",
      members: [],
    })

    const role = await getUserOrganizationRole("user-123", "org-123")

    expect(role).toBe("owner")
  })

  it("should return null for no access", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const role = await getUserOrganizationRole("user-123", "org-123")

    expect(role).toBeNull()
  })
})

describe("checkOrganizationPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return true for owner with member permission", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "user-123",
      visibility: "private",
      members: [],
    })

    const hasPermission = await checkOrganizationPermission("user-123", "org-123", "member")

    expect(hasPermission).toBe(true)
  })

  it("should return true for admin with member permission", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [
        {
          userId: "user-123",
          role: "admin",
        },
      ],
    })

    const hasPermission = await checkOrganizationPermission("user-123", "org-123", "member")

    expect(hasPermission).toBe(true)
  })

  it("should return false for member with admin permission", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [
        {
          userId: "user-123",
          role: "member",
        },
      ],
    })

    const hasPermission = await checkOrganizationPermission("user-123", "org-123", "admin")

    expect(hasPermission).toBe(false)
  })

  it("should return false for no access", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const hasPermission = await checkOrganizationPermission("user-123", "org-123", "member")

    expect(hasPermission).toBe(false)
  })
})

describe("canEditOrganization", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return true for owner", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "user-123",
      visibility: "private",
      members: [],
    })

    const canEdit = await canEditOrganization("user-123", "org-123")

    expect(canEdit).toBe(true)
  })

  it("should return true for admin", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [
        {
          userId: "user-123",
          role: "admin",
        },
      ],
    })

    const canEdit = await canEditOrganization("user-123", "org-123")

    expect(canEdit).toBe(true)
  })

  it("should return false for member", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [
        {
          userId: "user-123",
          role: "member",
        },
      ],
    })

    const canEdit = await canEditOrganization("user-123", "org-123")

    expect(canEdit).toBe(false)
  })
})

describe("canManageMembers", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return true for owner", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "user-123",
      visibility: "private",
      members: [],
    })

    const canManage = await canManageMembers("user-123", "org-123")

    expect(canManage).toBe(true)
  })

  it("should return true for admin", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [
        {
          userId: "user-123",
          role: "admin",
        },
      ],
    })

    const canManage = await canManageMembers("user-123", "org-123")

    expect(canManage).toBe(true)
  })

  it("should return false for member", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [
        {
          userId: "user-123",
          role: "member",
        },
      ],
    })

    const canManage = await canManageMembers("user-123", "org-123")

    expect(canManage).toBe(false)
  })
})

describe("canDeleteOrganization", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return true for owner", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "user-123",
      visibility: "private",
      members: [],
    })

    const canDelete = await canDeleteOrganization("user-123", "org-123")

    expect(canDelete).toBe(true)
  })

  it("should return false for admin", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [
        {
          userId: "user-123",
          role: "admin",
        },
      ],
    })

    const canDelete = await canDeleteOrganization("user-123", "org-123")

    expect(canDelete).toBe(false)
  })
})

describe("canCreateMockInOrganization", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return true for owner", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "user-123",
      visibility: "private",
      members: [],
    })

    const canCreate = await canCreateMockInOrganization("user-123", "org-123")

    expect(canCreate).toBe(true)
  })

  it("should return true for member", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: "org-123",
      ownerId: "other-user",
      visibility: "private",
      members: [
        {
          userId: "user-123",
          role: "member",
        },
      ],
    })

    const canCreate = await canCreateMockInOrganization("user-123", "org-123")

    expect(canCreate).toBe(true)
  })

  it("should return false for no access", async () => {
    ;(prisma.organization.findUnique as jest.Mock).mockResolvedValue(null)

    const canCreate = await canCreateMockInOrganization("user-123", "org-123")

    expect(canCreate).toBe(false)
  })
})

