import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import {
  checkOrganizationAccess,
  canManageMembers,
} from "@/lib/organization-auth"

/**
 * PUT /api/organizations/[id]/members/[memberId] - Update member role
 */
export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const { id, memberId } = await params

    // Check if id is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    // Find organization by id or slug
    // @ts-expect-error - Organization model exists in Prisma schema
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

    // Check user can manage members
    const canManage = await canManageMembers(user.id, organizationId)
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to manage members" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input using Yup validation
    const { validateAndParse, getValidationErrorMessage, updateMemberRoleSchema } = await import("@/lib/validation")
    const validationResult = await validateAndParse(updateMemberRoleSchema, body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: getValidationErrorMessage(validationResult.error) },
        { status: 400 }
      )
    }

    const { role } = validationResult.data

    // Get member record
    // @ts-expect-error - OrganizationMember model exists in Prisma schema
    const member = await prisma.organizationMember.findUnique({
      where: {
        id: memberId,
        organizationId: organizationId,
      },
      include: {
        organization: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Prevent changing owner role
    if (member.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change owner role" },
        { status: 400 }
      )
    }

    // Prevent changing role of organization owner
    if (member.organization.ownerId === member.userId) {
      return NextResponse.json(
        { error: "Cannot change role of organization owner" },
        { status: 400 }
      )
    }

    // Update member role
    // @ts-expect-error - OrganizationMember model exists in Prisma schema
    const updatedMember = await prisma.organizationMember.update({
      where: {
        id: memberId,
      },
      data: {
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Member role updated successfully",
      member: updatedMember,
    })
  } catch (error) {
    console.error("Error updating member role:", error)
    return NextResponse.json(
      {
        error: "Failed to update member role",
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
 * DELETE /api/organizations/[id]/members/[memberId] - Remove member
 */
export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const { id, memberId } = await params

    // Check if id is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    // Find organization by id or slug
    // @ts-expect-error - Organization model exists in Prisma schema
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

    // Get member record
    // @ts-expect-error - OrganizationMember model exists in Prisma schema
    const member = await prisma.organizationMember.findUnique({
      where: {
        id: memberId,
        organizationId: organizationId,
      },
      include: {
        organization: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Check if user is trying to remove themselves
    const isRemovingSelf = member.userId === user.id

    // Check permissions
    if (!isRemovingSelf) {
      // Only owners/admins can remove other members
      const canManage = await canManageMembers(user.id, organizationId)
      if (!canManage) {
        return NextResponse.json(
          { error: "You don't have permission to remove members" },
          { status: 403 }
        )
      }
    }

    // Prevent removing owner
    if (member.role === "owner" || member.organization.ownerId === member.userId) {
      return NextResponse.json(
        { error: "Cannot remove organization owner" },
        { status: 400 }
      )
    }

    // Delete member record
    // @ts-expect-error - OrganizationMember model exists in Prisma schema
    await prisma.organizationMember.delete({
      where: {
        id: memberId,
      },
    })

    return NextResponse.json({
      message: "Member removed successfully",
    })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json(
      {
        error: "Failed to remove member",
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

