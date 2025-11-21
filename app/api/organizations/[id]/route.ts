import { withAuth, withOptionalAuthParams } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import {
  checkOrganizationAccess,
  canEditOrganization,
  canDeleteOrganization,
  generateUniqueSlug,
} from "@/lib/organization-auth"

/**
 * GET /api/organizations/[id] - Get organization details
 * Public organizations are accessible without authentication
 */
export const GET = withOptionalAuthParams(async (request, { id }, user) => {
  try {
    // Check if id is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    // Find organization by id or slug
    const orgLookup = await prisma.organization.findUnique({
      where: isUUID ? { id } : { slug: id },
      select: { id: true, visibility: true },
    })

    if (!orgLookup) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const organizationId = orgLookup.id

    // For public organizations, allow access without authentication
    if (orgLookup.visibility === "public") {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          _count: {
            select: {
              members: true,
              mocks: true,
            },
          },
        },
      })

      if (!organization) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        )
      }

      // Get user's role if authenticated
      let userRole: string | null = null
      if (user) {
        const access = await checkOrganizationAccess(user.id, organizationId)
        userRole = access.role
      }

      return NextResponse.json({
        organization: {
          ...organization,
          userRole,
        },
      })
    }

    // Private organizations require authentication
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check user has access (owner/member)
    const access = await checkOrganizationAccess(user.id, organizationId)

    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            members: true,
            mocks: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      organization: {
        ...organization,
        userRole: access.role,
      },
    })
  } catch (error) {
    console.error("Error fetching organization:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch organization",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/organizations/[id] - Update organization
 */
export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const { id } = await params

    // Check if id is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    // Find organization by id or slug
    const orgLookup = await prisma.organization.findUnique({
      where: isUUID ? { id } : { slug: id },
      select: { id: true },
    })

    if (!orgLookup) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const organizationId = orgLookup.id

    // Check user can edit organization
    const canEdit = await canEditOrganization(user.id, organizationId)
    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this organization" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate and sanitize input using Yup validation + sanitization
    const { validateAndSanitizeOrganizationUpdate } = await import("@/lib/input-security")
    const validationResult = await validateAndSanitizeOrganizationUpdate(body)

    if (!validationResult.success) {
      return validationResult.error
    }

    const { name, description, visibility } = validationResult.data

    // Get current organization
    const currentOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (!currentOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Generate new slug if name changed
    let slug = currentOrg.slug
    if (name && name.trim() !== currentOrg.name) {
      slug = await generateUniqueSlug(name.trim())
    }

    // Update organization
    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(visibility && { visibility }),
        ...(slug !== currentOrg.slug && { slug }),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            mocks: true,
          },
        },
      },
    })

    // Get user's role
    const access = await checkOrganizationAccess(user.id, organizationId)

    return NextResponse.json({
      message: "Organization updated successfully",
      organization: {
        ...organization,
        userRole: access.role,
      },
    })
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json(
      {
        error: "Failed to update organization",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/organizations/[id] - Delete organization
 */
export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const { id } = await params

    // Check if id is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    // Find organization by id or slug
    const orgLookup = await prisma.organization.findUnique({
      where: isUUID ? { id } : { slug: id },
      select: { id: true },
    })

    if (!orgLookup) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const organizationId = orgLookup.id

    // Check user is owner
    const canDelete = await canDeleteOrganization(user.id, organizationId)
    if (!canDelete) {
      return NextResponse.json(
        { error: "Only the organization owner can delete it" },
        { status: 403 }
      )
    }

    // Delete organization (cascade will delete members and mocks)
    await prisma.organization.delete({
      where: { id: organizationId },
    })

    return NextResponse.json({
      message: "Organization deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json(
      {
        error: "Failed to delete organization",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    )
  }
})

