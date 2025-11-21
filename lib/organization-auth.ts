/**
 * Organization Access Control Utilities
 * Provides functions for checking organization access and permissions
 */

import { prisma } from "@/lib/prisma"

export type OrganizationRole = "owner" | "admin" | "member"

export interface OrganizationAccess {
  hasAccess: boolean
  role: OrganizationRole | null
  isOwner: boolean
  isAdmin: boolean
  isMember: boolean
}

/**
 * Generate a unique slug from organization name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by checking for duplicates
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = generateSlug(name)
  let slug = baseSlug
  let counter = 1

  while (true) {  
    const existing = await prisma.organization.findUnique({
      where: { slug },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

/**
 * Check if user has access to organization
 * Returns access information including role
 */
export async function checkOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<OrganizationAccess> {
  // Check if user is the owner
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        where: { userId },
      },
    },
  })

  if (!organization) {
    return {
      hasAccess: false,
      role: null,
      isOwner: false,
      isAdmin: false,
      isMember: false,
    }
  }

  // Check if organization is public
  if (organization.visibility === "public") {
    // Public organizations are accessible to everyone
    // But only members have roles
    const member = organization.members[0]
    if (member) {
      const role = member.role as OrganizationRole
      return {
        hasAccess: true,
        role,
        isOwner: role === "owner",
        isAdmin: role === "admin" || role === "owner",
        isMember: true,
      }
    }
    return {
      hasAccess: true,
      role: null,
      isOwner: false,
      isAdmin: false,
      isMember: false,
    }
  }

  // Private organizations require membership
  if (organization.ownerId === userId) {
    return {
      hasAccess: true,
      role: "owner",
      isOwner: true,
      isAdmin: true,
      isMember: true,
    }
  }

  const member = organization.members[0]
  if (!member) {
    return {
      hasAccess: false,
      role: null,
      isOwner: false,
      isAdmin: false,
      isMember: false,
    }
  }

  const role = member.role as OrganizationRole
  return {
    hasAccess: true,
    role,
    isOwner: false,
    isAdmin: role === "admin",
    isMember: true,
  }
}

/**
 * Get user's role in organization
 */
export async function getUserOrganizationRole(
  userId: string,
  organizationId: string
): Promise<OrganizationRole | null> {
  const access = await checkOrganizationAccess(userId, organizationId)
  return access.role
}

/**
 * Check if user has specific role or higher
 */
export async function checkOrganizationPermission(
  userId: string,
  organizationId: string,
  requiredRole: OrganizationRole
): Promise<boolean> {
  const access = await checkOrganizationAccess(userId, organizationId)

  if (!access.hasAccess) {
    return false
  }

  const roleHierarchy: Record<OrganizationRole, number> = {
    member: 1,
    admin: 2,
    owner: 3,
  }

  const userRoleLevel = access.role ? roleHierarchy[access.role] : 0
  const requiredRoleLevel = roleHierarchy[requiredRole]

  return userRoleLevel >= requiredRoleLevel
}

/**
 * Check if user can edit organization settings
 * Requires owner or admin role
 */
export async function canEditOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return checkOrganizationPermission(userId, organizationId, "admin")
}

/**
 * Check if user can manage members
 * Requires owner or admin role
 */
export async function canManageMembers(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return checkOrganizationPermission(userId, organizationId, "admin")
}

/**
 * Check if user can delete organization
 * Requires owner role
 */
export async function canDeleteOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return checkOrganizationPermission(userId, organizationId, "owner")
}

/**
 * Check if user can create mocks in organization
 * Requires member role or higher
 */
export async function canCreateMockInOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return checkOrganizationPermission(userId, organizationId, "member")
}

