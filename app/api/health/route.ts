import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/test-connection"

/**
 * Health check endpoint
 * Tests database connection and returns status
 */
export async function GET() {
  try {
    const dbTest = await testDatabaseConnection()

    if (!dbTest.success) {
      return NextResponse.json(
        {
          status: "unhealthy",
          database: {
            connected: false,
            error: dbTest.error,
          },
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: "healthy",
      database: {
        connected: true,
        message: dbTest.message,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    )
  }
}
