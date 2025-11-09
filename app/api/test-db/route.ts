import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Test endpoint to check database connection
export async function GET() {
  try {
    // Test 1: Check if Prisma can connect
    await prisma.$connect()

    // Test 2: Try a simple query
    const userCount = await prisma.user.count()

    // Test 3: Try querying MockApi table
    const mockCount = await prisma.mockApi.count()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        userCount,
        mockCount,
        connectionString: process.env.DATABASE_URL
          ? "DATABASE_URL is set"
          : process.env.NEXT_PUBLIC_SUPABASE_CONNECTION_STRING
            ? "NEXT_PUBLIC_SUPABASE_CONNECTION_STRING is set"
            : "No connection string found",
      },
    })
  } catch (error) {
    console.error("Database test error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode:
          error instanceof Error && error.message.includes("P")
            ? error.message.match(/P\d+/)?.[0]
            : undefined,
        stack:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.stack
            : undefined,
        connectionString: process.env.DATABASE_URL
          ? `DATABASE_URL is set (length: ${process.env.DATABASE_URL.length})`
          : process.env.NEXT_PUBLIC_SUPABASE_CONNECTION_STRING
            ? `NEXT_PUBLIC_SUPABASE_CONNECTION_STRING is set (length: ${process.env.NEXT_PUBLIC_SUPABASE_CONNECTION_STRING.length})`
            : "No connection string found",
      },
      { status: 500 }
    )
  }
}
