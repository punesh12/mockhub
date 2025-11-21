import { withAuth, withOptionalAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { generateUniqueSlug } from "@/lib/organization-auth"

/**
 * GET /api/organizations - List organizations
 * - If authenticated: returns user's organizations (owner/member)
 * - If public=true: returns all public organizations (no auth required)
 */
export const GET = withOptionalAuth(async (request, user) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit
    const search = searchParams.get("search") || ""
    const visibility = searchParams.get("visibility") || "" // "public" or "private"
    const publicOnly = searchParams.get("public") === "true" // Discover public orgs

    // If requesting public organizations discovery, return all public orgs
    if (publicOnly) {
      const whereClause: Prisma.OrganizationWhereInput = {
        visibility: (visibility || "public") as "public" | "private",
      }

      // Add search filter
      if (search) {
        whereClause.AND = [
          {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          },
        ]
      }

      const [organizations, total] = await Promise.all([
        prisma.organization.findMany({
          where: whereClause,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                members: true,
                mocks: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.organization.count({
          where: whereClause,
        }),
      ])

      // Add user's role if authenticated
      const organizationsWithRole = await Promise.all(
        organizations.map(async (org: (typeof organizations)[0]) => {
          let userRole: string | null = null
          if (user) {
            if (org.ownerId === user.id) {
              userRole = "owner"
            } else {
              const member = await prisma.organizationMember.findUnique({
                where: {
                  organizationId_userId: {
                    organizationId: org.id,
                    userId: user.id,
                  },
                },
              })
              userRole = member?.role || null
            }
          }
          return {
            ...org,
            userRole,
          }
        })
      )

      return NextResponse.json({
        organizations: organizationsWithRole,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    // Default: return user's organizations (requires authentication)
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Build where clause for user's organizations
    const whereClause: Prisma.OrganizationWhereInput = {
      OR: [
        { ownerId: user.id },
        {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      ],
    }

    if (visibility) {
      whereClause.visibility = visibility as "public" | "private"
    }

    // Add search filter
    if (search) {
      whereClause.AND = [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        },
      ]
    }

    // Get organizations where user is owner or member
    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where: whereClause,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            select: {
              id: true,
              role: true,
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
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.organization.count({
        where: whereClause,
      }),
    ])

    // Add user's role to each organization
    const organizationsWithRole = await Promise.all(
      organizations.map(async (org: (typeof organizations)[0]) => {
        let userRole: string | null = null

        if (org.ownerId === user.id) {
          userRole = "owner"
        } else {
          const member = await prisma.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId: org.id,
                userId: user.id,
              },
            },
          })
          userRole = member?.role || null
        }

        return {
          ...org,
          userRole,
        }
      })
    )

    return NextResponse.json({
      organizations: organizationsWithRole,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch organizations",
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
 * POST /api/organizations - Create new organization
 */
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json()

    // Validate and sanitize input using Yup validation + sanitization
    const { validateAndSanitizeOrganizationCreate } = await import("@/lib/input-security")
    const validationResult = await validateAndSanitizeOrganizationCreate(body)

    if (!validationResult.success) {
      return validationResult.error
    }

    const { name, description, visibility } = validationResult.data

    // Generate unique slug (will be sanitized in generateUniqueSlug)
    const slug = await generateUniqueSlug(name)

    // Create organization with creator as owner  
    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        visibility,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
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

    return NextResponse.json(
      {
        message: "Organization created successfully",
        organization: {
          ...organization,
          userRole: "owner",
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json(
      {
        error: "Failed to create organization",
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

