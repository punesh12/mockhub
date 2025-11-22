/**
 * Tests for /api/history/[id] route (DELETE)
 */

import { DELETE } from "@/app/api/history/[id]/route"
import { NextRequest } from "next/server"
import { withAuthParams } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { createMockUser } from "@/tests/utils/mock-data"

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  withAuthParams: jest.fn((handler) => async (request: NextRequest, { params }: { params: Promise<{ id: string }> }, user?: any) => {
    const resolvedParams = await params
    return handler(request, resolvedParams, user || createMockUser({ id: "user-123", email: "test@example.com" }))
  }),
}))

jest.mock("@/lib/prisma", () => ({
  prisma: {
    requestHistory: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

describe("DELETE /api/history/[id]", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should delete history item successfully", async () => {
    const historyItem = {
      id: "history-123",
      userId: "user-123",
    }

    ;(prisma.requestHistory.findUnique as jest.Mock).mockResolvedValue(historyItem)
    ;(prisma.requestHistory.delete as jest.Mock).mockResolvedValue(historyItem)

    const request = new NextRequest("http://localhost:3000/api/history/history-123", {
      method: "DELETE",
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: "history-123" }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("History item deleted successfully")
    expect(prisma.requestHistory.delete).toHaveBeenCalledWith({
      where: { id: "history-123" },
    })
  })

  it("should return 404 if history item not found", async () => {
    ;(prisma.requestHistory.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/history/nonexistent", {
      method: "DELETE",
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("History item not found")
  })

  it("should return 403 if user doesn't own the history item", async () => {
    const historyItem = {
      id: "history-123",
      userId: "other-user",
    }

    ;(prisma.requestHistory.findUnique as jest.Mock).mockResolvedValue(historyItem)

    const request = new NextRequest("http://localhost:3000/api/history/history-123", {
      method: "DELETE",
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: "history-123" }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("Unauthorized")
    expect(prisma.requestHistory.delete).not.toHaveBeenCalled()
  })
})

