import { withOptionalAuthParams } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { checkOrganizationAccess } from "@/lib/organization-auth"
import { generateOpenApiSpec, specToJson, specToYaml } from "@/lib/openapi-utils"

/**
 * GET /api/organizations/[id]/openapi - Generate OpenAPI 3.0 spec for organization mocks
 * Supports both UUID and slug-based lookup
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
    // For private organizations, require authentication and check access
    if (orgLookup.visibility === "private") {
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }

      const access = await checkOrganizationAccess(user.id, organizationId)
      if (!access.hasAccess) {
        return NextResponse.json(
          { error: "Organization not found or access denied" },
          { status: 404 }
        )
      }
    }

    // Fetch organization details
    const organizationData = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        visibility: true,
      },
    })

    if (!organizationData) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Type-safe organization object
    const organization = {
      id: organizationData.id,
      name: organizationData.name,
      slug: organizationData.slug,
      description: organizationData.description,
      visibility: organizationData.visibility as "private" | "public",
    }

    // Fetch all mocks for this organization
    const mocksData = await prisma.mockApi.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        endpoint: true,
        method: true,
        responseBody: true,
        responseCode: true,
        createdAt: true,
      },
      orderBy: {
        endpoint: "asc",
      },
    })

    // Convert mocks to match MockApi interface (createdAt as string)
    const mocks = mocksData.map((mock) => ({
      id: mock.id,
      name: mock.name,
      endpoint: mock.endpoint,
      method: mock.method,
      responseBody: mock.responseBody,
      responseCode: mock.responseCode,
      createdAt: mock.createdAt.toISOString(),
    }))

    // Get base URL from request
    const origin = request.headers.get("origin") || request.headers.get("host")
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    const baseUrl = origin
      ? `${protocol}://${origin}`
      : process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_VERCEL_URL ||
        "http://localhost:3000"

    // Generate OpenAPI spec with organization-scoped paths
    const spec = generateOpenApiSpec(organization, mocks, baseUrl, true)

    // Get format from query parameter (default: json)
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get("format") || "json"

    // Return spec in requested format
    if (format === "yaml") {
      const yamlContent = await specToYaml(spec)
      return new NextResponse(yamlContent, {
        status: 200,
        headers: {
          "Content-Type": "application/x-yaml",
          "Content-Disposition": `attachment; filename="${organization.slug}-openapi.yaml"`,
        },
      })
    }

    // Default: JSON format
    const jsonContent = specToJson(spec)
    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${organization.slug}-openapi.json"`,
      },
    })
  } catch (error) {
    console.error("Error generating OpenAPI spec:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Failed to generate OpenAPI specification",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
})

