import { withAuthParams } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { checkOrganizationAccess, canCreateMockInOrganization } from "@/lib/organization-auth"
import {
  parseOpenApiSpec,
  extractMocksFromOpenApi,
  validateOpenApiSpec,
  type ExtractedMock,
} from "@/lib/openapi-utils"

/**
 * POST /api/organizations/[id]/import-openapi - Import OpenAPI spec and create mocks
 * Supports both UUID and slug-based lookup
 */
export const POST = withAuthParams(async (request, { id }, user) => {
  try {
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

    // Check user has access and can create mocks
    const access = await checkOrganizationAccess(user.id, organizationId)
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 }
      )
    }

    const canCreate = await canCreateMockInOrganization(user.id, organizationId)
    if (!canCreate) {
      return NextResponse.json(
        { error: "You don't have permission to create mocks in this organization" },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { fileContent, fileType = "json", selectedEndpoints } = body

    if (!fileContent) {
      return NextResponse.json(
        { error: "File content is required" },
        { status: 400 }
      )
    }

    // Validate file type
    if (fileType !== "json" && fileType !== "yaml") {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'json' or 'yaml'" },
        { status: 400 }
      )
    }

    // Parse OpenAPI spec
    let spec
    try {
      spec = await parseOpenApiSpec(fileContent, fileType)
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to parse OpenAPI specification",
          details:
            error instanceof Error
              ? error.message
              : "Invalid OpenAPI format",
        },
        { status: 400 }
      )
    }

    // Validate spec
    const validation = validateOpenApiSpec(spec)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Invalid OpenAPI specification",
          details: validation.error,
        },
        { status: 400 }
      )
    }

    // Extract mocks from spec
    let extractedMocks: ExtractedMock[]
    try {
      extractedMocks = extractMocksFromOpenApi(spec)
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to extract mocks from OpenAPI specification",
          details:
            error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      )
    }

    if (extractedMocks.length === 0) {
      return NextResponse.json(
        { error: "No endpoints found in OpenAPI specification" },
        { status: 400 }
      )
    }

    // Filter by selected endpoints if provided
    let mocksToCreate = extractedMocks
    if (selectedEndpoints && Array.isArray(selectedEndpoints) && selectedEndpoints.length > 0) {
      mocksToCreate = extractedMocks.filter((mock) =>
        selectedEndpoints.includes(`${mock.method} ${mock.endpoint}`)
      )
    }

    // Ensure user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      if (!user.email) {
        return NextResponse.json(
          { error: "User email is missing. Please log out and log in again." },
          { status: 400 }
        )
      }

      try {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
            email: user.email,
            password: "",
          },
        })
      } catch (createError) {
        console.error("Error creating user:", createError)
        dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        })
        if (!dbUser) {
          return NextResponse.json(
            { error: "Failed to create user record" },
            { status: 500 }
          )
        }
      }
    }

    // Create mocks (skip duplicates)
    const createdMocks = []
    const skippedMocks = []
    const errors = []

    for (const mock of mocksToCreate) {
      try {
        // Check if mock already exists
        const existingMock = await prisma.mockApi.findFirst({
          where: {
            organizationId,
            endpoint: mock.endpoint,
            method: mock.method.toUpperCase(),
          },
        })

        if (existingMock) {
          skippedMocks.push({
            ...mock,
            reason: "Endpoint already exists",
          })
          continue
        }

        // Create mock
        const createdMock = await prisma.mockApi.create({
          data: {
            userId: user.id,
            organizationId,
            name: mock.name,
            endpoint: mock.endpoint,
            method: mock.method.toUpperCase(),
            responseCode: mock.responseCode,
            responseBody: mock.responseBody as Prisma.InputJsonValue,
          },
        })

        createdMocks.push(createdMock)
      } catch (error) {
        console.error(`Error creating mock ${mock.name}:`, error)
        errors.push({
          ...mock,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      message: `Imported ${createdMocks.length} mock(s) successfully`,
      created: createdMocks.length,
      skipped: skippedMocks.length,
      errors: errors.length,
      details: {
        created: createdMocks.map((m) => ({
          id: m.id,
          name: m.name,
          endpoint: m.endpoint,
          method: m.method,
        })),
        skipped: skippedMocks.map((m) => ({
          name: m.name,
          endpoint: m.endpoint,
          method: m.method,
          reason: m.reason,
        })),
        errors: errors.map((m) => ({
          name: m.name,
          endpoint: m.endpoint,
          method: m.method,
          error: m.error,
        })),
      },
    })
  } catch (error) {
    console.error("Error importing OpenAPI spec:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Failed to import OpenAPI specification",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
})

