import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import {
  checkOrganizationAccess,
  canManageMembers,
} from "@/lib/organization-auth"

/**
 * GET /api/organizations/[id]/members - List organization members
 */
export const GET = withAuth(async (request, user, { params }) => {
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

    // Check user has access
    const access = await checkOrganizationAccess(user.id, organizationId)
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 }
      )
    }

    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId: organizationId,
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
      orderBy: [
        { role: "asc" }, // Owner first, then admin, then member
        { createdAt: "asc" },
      ],
    })

    return NextResponse.json({
      members,
    })
  } catch (error) {
    console.error("Error fetching organization members:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch organization members",
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
 * POST /api/organizations/[id]/members - Add member to organization
 */
export const POST = withAuth(async (request, user, { params }) => {
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

    // Check user can manage members
    const canManage = await canManageMembers(user.id, organizationId)
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to manage members" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate and sanitize input using Yup validation + sanitization
    const { validateAndSanitizeInviteMember } = await import("@/lib/input-security")
    const validationResult = await validateAndSanitizeInviteMember(body)

    if (!validationResult.success) {
      return validationResult.error
    }

    const { email, role } = validationResult.data

    if (role !== "admin" && role !== "member") {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'member'" },
        { status: 400 }
      )
    }

    // Find user by email
    const memberUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!memberUser) {
      return NextResponse.json(
        { error: "User with this email not found" },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: organizationId,
          userId: memberUser.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 }
      )
    }

    // Check if user is trying to add themselves
    if (memberUser.id === user.id) {
      return NextResponse.json(
        { error: "You are already a member of this organization" },
        { status: 400 }
      )
    }

    // Create member record using Prisma client
    const member = await prisma.organizationMember.create({
      data: {
        organizationId: organizationId,
        userId: memberUser.id,
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

    return NextResponse.json(
      {
        message: "Member added successfully",
        member,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error adding organization member:", error)
    return NextResponse.json(
      {
        error: "Failed to add member",
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

