import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
    const { path } = await params

    // Reconstruct the endpoint path
    // path will be an array like ["users"] or ["users", "123"]
    const endpoint = "/" + path.join("/")

    // Skip if this is a reserved route
    const reservedRoutes = [
      "mocks",
      "auth",
      "test",
      "history",
      "health",
      "test-db",
    ]
    if (path.length > 0 && reservedRoutes.includes(path[0])) {
      // Let Next.js handle reserved routes normally
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Look up the mock API by endpoint and method
    const mock = await prisma.mockApi.findFirst({
      where: {
        endpoint: endpoint,
        method: method.toUpperCase(),
      },
      select: {
        id: true,
        name: true,
        responseBody: true,
        responseCode: true,
        userId: true,
      },
    })

    if (!mock) {
      return NextResponse.json(
        {
          error: "Mock API not found",
          message: `No mock found for ${method} ${endpoint}`,
        },
        { status: 404 }
      )
    }

    // Return the mock response with the configured status code and CORS headers
    return NextResponse.json(mock.responseBody, {
      status: mock.responseCode,
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
