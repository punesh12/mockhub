import { withAuth } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import {
  parseOpenApiSpec,
  extractMocksFromOpenApi,
  validateOpenApiSpec,
} from "@/lib/openapi-utils"

/**
 * POST /api/organizations/preview-import - Preview mocks from OpenAPI spec without importing
 */
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json()
    const { fileContent, fileType = "json" } = body

    if (!fileContent) {
      return NextResponse.json(
        { error: "File content is required" },
        { status: 400 }
      )
    }

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
    let extractedMocks
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

    return NextResponse.json({
      mocks: extractedMocks,
      count: extractedMocks.length,
    })
  } catch (error) {
    console.error("Error previewing OpenAPI spec:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Failed to preview OpenAPI specification",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
})

