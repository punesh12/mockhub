import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerUser } from "@/lib/supabase-auth"
import { checkOrganizationAccess } from "@/lib/organization-auth"
import { Prisma } from "@prisma/client"

/**
 * Catch-all route handler for executing mock APIs
 *
 * This route handles requests to /api/* that don't match specific routes.
 * It looks up the requested endpoint and method in the MockApi table
 * and returns the configured mock response.
 *
 * Example:
 * - User creates mock with endpoint "/users" and method "GET"
 * - Request to GET /api/users will return the mock response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, "GET", params)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, "POST", params)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, "PUT", params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, "PATCH", params)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, "DELETE", params)
}

export async function OPTIONS() {
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}

async function handleMockRequest(
  request: NextRequest,
  method: string,
  params: Promise<{ path: string[] }>
) {
  try {
    // Rate limit check for mock API execution (more lenient)
    // Try to get user ID if authenticated for better rate limiting
    let userId: string | undefined
    try {
      const { getServerUser } = await import("@/lib/supabase-auth")
      const user = await getServerUser()
      userId = user?.id
    } catch {
      // Not authenticated, will use IP-based rate limiting
    }

    const { rateLimitCheck, RATE_LIMITS } = await import("@/lib/rate-limit")
    const rateLimitResponse = rateLimitCheck(request, RATE_LIMITS.MOCK_API, userId)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { path } = await params

    // Skip if this is a reserved route
    const reservedRoutes = [
      "mocks",
      "auth",
      "test",
      "history",
      "health",
      "test-db",
      "organizations",
      "user",
      "dashboard",
    ]
    if (path.length > 0 && reservedRoutes.includes(path[0])) {
      // Let Next.js handle reserved routes normally
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Check if this is an organization-scoped endpoint: /api/org/[slug]/[endpoint]
    let organizationId: string | null = null
    let endpoint: string
    let isOrganizationScoped = false

    if (path.length >= 2 && (path[0] === "org" || path[0] === "organizations")) {
      // Organization-scoped endpoint: /api/org/[slug]/[endpoint...]
      isOrganizationScoped = true
      const organizationSlug = path[1]
      const endpointParts = path.slice(2)
      endpoint = "/" + endpointParts.join("/")

      // Find organization by slug
      const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true, visibility: true },
      })

      if (!organization) {
        return NextResponse.json(
          {
            error: "Organization not found",
            message: `Organization with slug "${organizationSlug}" not found`,
          },
          { status: 404 }
        )
      }

      organizationId = organization.id

      // Check access for private organizations
      if (organization.visibility === "private") {
        const user = await getServerUser()
        if (!user) {
          return NextResponse.json(
            {
              error: "Unauthorized",
              message: "This organization is private. Authentication required.",
            },
            { status: 401 }
          )
        }

        const access = await checkOrganizationAccess(user.id, organization.id)
        if (!access.hasAccess) {
          return NextResponse.json(
            {
              error: "Forbidden",
              message: "You don't have access to this organization's mocks",
            },
            { status: 403 }
          )
        }
      }
      // Public organizations are accessible without authentication
    } else {
      // Regular endpoint: /api/[endpoint...]
      endpoint = "/" + path.join("/")
    }

    // Look up the mock API by endpoint, method, and organization
    let mock: unknown = null

    if (isOrganizationScoped) {
      // For organization-scoped endpoints, only look for mocks in that organization
      mock = await prisma.mockApi.findFirst({
        where: {
          endpoint: endpoint,
          method: method.toUpperCase(),
          organizationId: organizationId,
        } as Prisma.MockApiWhereInput,
        include: {
          organization: {
            select: {
              id: true,
              visibility: true,
            },
          },
        } as Prisma.MockApiInclude,
      })
    } else {
      // For regular endpoints, check in this order:
      // 1. Personal mocks (no organization)
      // 2. Public organization mocks
      mock = await prisma.mockApi.findFirst({
        where: {
          endpoint: endpoint,
          method: method.toUpperCase(),
          organizationId: null,
        } as Prisma.MockApiWhereInput,
        include: {
          organization: {
            select: {
              id: true,
              visibility: true,
            },
          },
        } as Prisma.MockApiInclude,
      })

      // If not found, check public organization mocks
      if (!mock) {
        const publicOrgMocks = await prisma.mockApi.findMany({
          where: {
            endpoint: endpoint,
            method: method.toUpperCase(),
            organizationId: { not: null },
            organization: {
              visibility: "public",
            },
          } as Prisma.MockApiWhereInput,
          include: {
            organization: {
              select: {
                id: true,
                visibility: true,
              },
            },
          } as Prisma.MockApiInclude,
          take: 1,
        })

        if (publicOrgMocks.length > 0) {
          mock = publicOrgMocks[0]
        }
      }
    }

    if (!mock || typeof mock !== "object" || mock === null) {
      return NextResponse.json(
        {
          error: "Mock API not found",
          message: `No mock found for ${method} ${endpoint}${isOrganizationScoped ? ` in this organization` : ""}`,
        },
        { status: 404 }
      )
    }

    const mockData = mock as {
      id: string
      name: string
      responseBody: unknown
      responseCode: number
      userId: string
      organizationId: string | null
      organization: {
        id: string
        visibility: string
      } | null
    }

    // If mock belongs to a private organization, check access
    if (mockData.organization && mockData.organization.visibility === "private") {
      const user = await getServerUser()
      if (!user) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "This mock belongs to a private organization. Authentication required.",
          },
          { status: 401 }
        )
      }

      const access = await checkOrganizationAccess(user.id, mockData.organization.id)
      if (!access.hasAccess) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You don't have access to this organization's mocks",
          },
          { status: 403 }
        )
      }
    }

    // Return the mock response with the configured status code and CORS headers
    return NextResponse.json(mockData.responseBody, {
      status: mockData.responseCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  } catch (error) {
    console.error("Mock API execution error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
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
}
