/**
 * Tests for /api/mocks/[id] route (GET, PUT, DELETE)
 */

import { GET, PUT, DELETE } from "@/app/api/mocks/[id]/route"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateAndSanitizeMockApiUpdate } from "@/lib/input-security"
import { createMockUser } from "@/tests/utils/mock-data"

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  withAuthParams: jest.fn((handler) => async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params
    const mockUser = createMockUser({ id: "user-123", email: "test@example.com" })
    return handler(request, resolvedParams, mockUser)
  }),
}))

jest.mock("@/lib/prisma", () => ({
  prisma: {
    mockApi: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock("@/lib/input-security", () => ({
  validateAndSanitizeMockApiUpdate: jest.fn(),
}))

describe("GET /api/mocks/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return mock if user owns it", async () => {
    const mock = {
      id: "mock-123",
      userId: "user-123",
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: { message: "Success" },
      createdAt: new Date(),
      organization: null,
    }

    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(mock)

    const request = new NextRequest("http://localhost:3000/api/mocks/mock-123")
    const response = await GET(request, { params: Promise.resolve({ id: "mock-123" }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.mock).toEqual(mock)
    expect(prisma.mockApi.findUnique).toHaveBeenCalledWith({
      where: { id: "mock-123" },
      include: expect.any(Object),
    })
  })

  it("should return 404 if mock not found", async () => {
    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/mocks/nonexistent")
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Mock not found")
  })

  it("should return 403 if user doesn't own the mock", async () => {
    const mock = {
      id: "mock-123",
      userId: "other-user",
      name: "Other User's Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: {},
      createdAt: new Date(),
      organization: null,
    }

    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(mock)

    const request = new NextRequest("http://localhost:3000/api/mocks/mock-123")
    const response = await GET(request, { params: Promise.resolve({ id: "mock-123" }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("Forbidden - You don't have access to this mock")
  })
})

describe("PUT /api/mocks/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should update mock successfully", async () => {
    const existingMock = {
      id: "mock-123",
      userId: "user-123",
      name: "Old Name",
      endpoint: "/old",
      method: "GET",
      responseCode: 200,
      responseBody: { old: "data" },
    }

    const updateData = {
      name: "New Name",
      endpoint: "/new",
      method: "POST",
      responseCode: 201,
      responseBody: { new: "data" },
    }

    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(existingMock)
    ;(validateAndSanitizeMockApiUpdate as jest.Mock).mockResolvedValue({
      success: true,
      data: updateData,
    })
    ;(prisma.mockApi.findFirst as jest.Mock).mockResolvedValue(null)

    const updatedMock = {
      id: "mock-123",
      ...updateData,
      createdAt: new Date(),
      organization: null,
    }

    ;(prisma.mockApi.update as jest.Mock).mockResolvedValue(updatedMock)

    const requestBody = updateData
    const request = new NextRequest("http://localhost:3000/api/mocks/mock-123", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await PUT(request, { params: Promise.resolve({ id: "mock-123" }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Mock updated successfully")
    expect(data.mock.name).toBe("New Name")
    expect(prisma.mockApi.update).toHaveBeenCalled()
  })

  it("should return 404 if mock not found", async () => {
    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/mocks/nonexistent", {
      method: "PUT",
    })

    const response = await PUT(request, { params: Promise.resolve({ id: "nonexistent" }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Mock not found")
  })

  it("should return 403 if user doesn't own the mock", async () => {
    const existingMock = {
      id: "mock-123",
      userId: "other-user",
      name: "Other User's Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: {},
    }

    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(existingMock)

    const request = new NextRequest("http://localhost:3000/api/mocks/mock-123", {
      method: "PUT",
    })

    const response = await PUT(request, { params: Promise.resolve({ id: "mock-123" }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("Forbidden - You don't have access to this mock")
  })

  it("should return 400 if validation fails", async () => {
    const existingMock = {
      id: "mock-123",
      userId: "user-123",
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: {},
    }

    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(existingMock)
    ;(validateAndSanitizeMockApiUpdate as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        status: 400,
        json: () => Promise.resolve({ error: "Invalid input" }),
      },
    })

    const requestBody = { name: "" }
    const request = new NextRequest("http://localhost:3000/api/mocks/mock-123", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await PUT(request, { params: Promise.resolve({ id: "mock-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid input")
  })

  it("should return 400 if duplicate endpoint/method exists", async () => {
    const existingMock = {
      id: "mock-123",
      userId: "user-123",
      name: "Test Mock",
      endpoint: "/old",
      method: "GET",
      responseCode: 200,
      responseBody: {},
    }

    const updateData = {
      endpoint: "/new",
      method: "POST",
    }

    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(existingMock)
    ;(validateAndSanitizeMockApiUpdate as jest.Mock).mockResolvedValue({
      success: true,
      data: updateData,
    })
    ;(prisma.mockApi.findFirst as jest.Mock).mockResolvedValue({
      id: "other-mock",
      endpoint: "/new",
      method: "POST",
    })

    const requestBody = updateData
    const request = new NextRequest("http://localhost:3000/api/mocks/mock-123", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    const response = await PUT(request, { params: Promise.resolve({ id: "mock-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("A mock with this endpoint and method already exists")
  })

  it("should use existing values if fields not provided", async () => {
    const existingMock = {
      id: "mock-123",
      userId: "user-123",
      name: "Old Name",
      endpoint: "/old",
      method: "GET",
      responseCode: 200,
      responseBody: { old: "data" },
    }

    const updateData = {
      name: "New Name",
      // endpoint and method not provided
    }

    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(existingMock)
    ;(validateAndSanitizeMockApiUpdate as jest.Mock).mockResolvedValue({
      success: true,
      data: updateData,
    })
    ;(prisma.mockApi.findFirst as jest.Mock).mockResolvedValue(null)

    const updatedMock = {
      id: "mock-123",
      name: "New Name",
      endpoint: "/old", // Should use existing
      method: "GET", // Should use existing
      responseCode: 200,
      responseBody: { old: "data" },
      createdAt: new Date(),
      organization: null,
    }

    ;(prisma.mockApi.update as jest.Mock).mockResolvedValue(updatedMock)

    const requestBody = updateData
    const request = new NextRequest("http://localhost:3000/api/mocks/mock-123", {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    request.json = jest.fn().mockResolvedValue(requestBody)

    await PUT(request, { params: Promise.resolve({ id: "mock-123" }) })

    expect(prisma.mockApi.update).toHaveBeenCalled()
    const updateCall = (prisma.mockApi.update as jest.Mock).mock.calls[0][0]
    expect(updateCall.data.name).toBe("New Name")
    expect(updateCall.data.endpoint).toBe("/old")
    expect(updateCall.data.method).toBe("GET")
  })
})

describe("DELETE /api/mocks/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should delete mock successfully", async () => {
    const mock = {
      id: "mock-123",
      userId: "user-123",
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: {},
    }

    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(mock)
    ;(prisma.mockApi.delete as jest.Mock).mockResolvedValue(mock)

    const request = new NextRequest("http://localhost:3000/api/mocks/mock-123", {
      method: "DELETE",
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: "mock-123" }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Mock deleted successfully")
    expect(prisma.mockApi.delete).toHaveBeenCalledWith({
      where: { id: "mock-123" },
    })
  })

  it("should return 404 if mock not found", async () => {
    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/mocks/nonexistent", {
      method: "DELETE",
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Mock not found")
  })

  it("should return 403 if user doesn't own the mock", async () => {
    const mock = {
      id: "mock-123",
      userId: "other-user",
      name: "Other User's Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: {},
    }

    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue(mock)

    const request = new NextRequest("http://localhost:3000/api/mocks/mock-123", {
      method: "DELETE",
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: "mock-123" }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("Forbidden - You don't have access to this mock")
    expect(prisma.mockApi.delete).not.toHaveBeenCalled()
  })
})

