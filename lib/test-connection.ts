/**
 * Utility to test database connection
 * This can be used to verify Supabase connection is working
 */

import { prisma } from "./prisma"

export async function testDatabaseConnection(): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`

    return {
      success: true,
      message: "Database connection successful",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
