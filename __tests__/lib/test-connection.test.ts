/**
 * Tests for test-connection utility
 */

import { testDatabaseConnection } from "@/lib/test-connection"
import { prisma } from "@/lib/prisma"

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

describe("testDatabaseConnection", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return success when connection is working", async () => {
    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ "?column?": 1 }])

    const result = await testDatabaseConnection()

    expect(result.success).toBe(true)
    expect(result.message).toBe("Database connection successful")
    expect(result.error).toBeUndefined()
    expect(prisma.$queryRaw).toHaveBeenCalled()
  })

  it("should return error when connection fails", async () => {
    const errorMessage = "Connection timeout"
    ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error(errorMessage))

    const result = await testDatabaseConnection()

    expect(result.success).toBe(false)
    expect(result.error).toBe(errorMessage)
    expect(result.message).toBeUndefined()
  })

  it("should handle unknown error types", async () => {
    ;(prisma.$queryRaw as jest.Mock).mockRejectedValue("Unknown error")

    const result = await testDatabaseConnection()

    expect(result.success).toBe(false)
    expect(result.error).toBe("Unknown error")
  })
})

