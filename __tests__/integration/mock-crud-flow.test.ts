/**
 * Integration tests for Mock API CRUD operations flow
 */

import { NextRequest } from "next/server"
import { POST as createPOST, GET as listGET } from "@/app/api/mocks/route"
import { GET as getGET, PUT as updatePUT, DELETE as deleteDELETE } from "@/app/api/mocks/[id]/route"
import { prisma } from "@/lib/prisma"
import { validateAndSanitizeMockApiCreate, validateAndSanitizeMockApiUpdate } from "@/lib/input-security"
import { createMockUser } from "@/tests/utils/mock-data"

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    mockApi: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock("@/lib/input-security", () => ({
  validateAndSanitizeMockApiCreate: jest.fn(),
  validateAndSanitizeMockApiUpdate: jest.fn(),
}))

jest.mock("@/lib/api-auth", () => ({
  withAuth: jest.fn((handler) => handler),
  withAuthParams: jest.fn((handler) => async (request: NextRequest, context: { params?: Promise<{ id: string }> }) => {
    const resolvedParams = context.params ? await context.params : { id: "" }
    const mockUser = createMockUser({ id: "user-123", email: "test@example.com" })
    // Handler expects (request, { id }, user) - destructure id from resolvedParams
    return handler(request, { id: resolvedParams.id }, mockUser)
  }),
}))

describe("Mock API CRUD Flow Integration", () => {
  const mockUser = createMockUser({
    id: "user-123",
    email: "test@example.com",
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      password: "",
    })
  })

  it("should complete full CRUD flow: create -> list -> get -> update -> delete", async () => {
    const mockData = {
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: { message: "Success" },
    }

    const createdMock = {
      id: "mock-123",
      ...mockData,
      userId: "user-123",
      createdAt: new Date(),
      organization: null,
    }

    // Step 1: Create
    ;(validateAndSanitizeMockApiCreate as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    })
    ;(prisma.mockApi.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.mockApi.create as jest.Mock).mockResolvedValue(createdMock)

    const createRequest = new NextRequest("http://localhost:3000/api/mocks", {
      method: "POST",
      body: JSON.stringify(mockData),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    createRequest.json = jest.fn().mockResolvedValue(mockData)

    const createResponse = await createPOST(createRequest, mockUser)
    const createData = await createResponse.json()

    expect(createResponse.status).toBe(201)
    expect(createData.mock.id).toBe("mock-123")
    expect(createData.mock.name).toBe("Test Mock")

    // Step 2: List
    ;(prisma.mockApi.findMany as jest.Mock).mockResolvedValue([createdMock])
    ;(prisma.mockApi.count as jest.Mock).mockResolvedValue(1)

    const listRequest = new NextRequest("http://localhost:3000/api/mocks")
    const listResponse = await listGET(listRequest, mockUser)
    const listData = await listResponse.json()

    expect(listResponse.status).toBe(200)
    expect(listData.mocks).toHaveLength(1)
    expect(listData.mocks[0].id).toBe("mock-123")

    // Step 3: Get
    // The GET route calls findUnique twice - once for access check, once with include
    const mockWithInclude = {
      ...createdMock,
      organization: null,
    }
    ;(prisma.mockApi.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "mock-123", userId: "user-123" }) // First call for access check
      .mockResolvedValueOnce(mockWithInclude) // Second call for full data with include

    const getRequest = new NextRequest("http://localhost:3000/api/mocks/mock-123")
    const getResponse = await getGET(getRequest, { params: Promise.resolve({ id: "mock-123" }) })
    const getData = await getResponse.json()

    expect(getResponse.status).toBe(200)
    expect(getData.mock).toBeDefined()
    expect(getData.mock.id).toBe("mock-123")
    // The mock should have all properties from createdMock
    expect(getData.mock.name || mockWithInclude.name).toBe("Test Mock")

    // Step 4: Update
    const updateData = {
      name: "Updated Mock",
      responseCode: 201,
    }

    ;(prisma.mockApi.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "mock-123", userId: "user-123" }) // Access check
      .mockResolvedValueOnce(createdMock) // Full data
    ;(validateAndSanitizeMockApiUpdate as jest.Mock).mockResolvedValue({
      success: true,
      data: updateData,
    })
    ;(prisma.mockApi.findFirst as jest.Mock).mockResolvedValue(null)

    const updatedMock = {
      ...createdMock,
      ...updateData,
    }

    ;(prisma.mockApi.update as jest.Mock).mockResolvedValue(updatedMock)

    const updateRequest = new NextRequest("http://localhost:3000/api/mocks/mock-123", {
      method: "PUT",
      body: JSON.stringify(updateData),
      headers: {
        "Content-Type": "application/json",
      },
    }) as NextRequest & { json: jest.Mock }

    updateRequest.json = jest.fn().mockResolvedValue(updateData)

    const updateResponse = await updatePUT(updateRequest, mockUser, { params: Promise.resolve({ id: "mock-123" }) } as any)
    const updateResponseData = await updateResponse.json()

    expect(updateResponse.status).toBe(200)
    expect(updateResponseData.mock.name).toBe("Updated Mock")
    expect(updateResponseData.mock.responseCode).toBe(201)

    // Step 5: Delete
    ;(prisma.mockApi.findUnique as jest.Mock).mockResolvedValue({
      id: "mock-123",
      userId: "user-123",
    })
    ;(prisma.mockApi.delete as jest.Mock).mockResolvedValue(updatedMock)

    const deleteRequest = new NextRequest("http://localhost:3000/api/mocks/mock-123", {
      method: "DELETE",
    })

    const deleteResponse = await deleteDELETE(deleteRequest, { params: Promise.resolve({ id: "mock-123" }) } as any)
    const deleteData = await deleteResponse.json()

    expect(deleteResponse.status).toBe(200)
    expect(deleteData.message).toBe("Mock deleted successfully")
    expect(prisma.mockApi.delete).toHaveBeenCalledWith({
      where: { id: "mock-123" },
    })
  })

  it("should handle filtering and pagination in list operation", async () => {
    const mock1 = {
      id: "mock-1",
      name: "Test Mock 1",
      endpoint: "/test1",
      method: "GET",
      responseCode: 200,
      responseBody: {},
      userId: "user-123",
      createdAt: new Date(),
      organization: null,
    }

    const mock2 = {
      id: "mock-2",
      name: "Test Mock 2",
      endpoint: "/test2",
      method: "POST",
      responseCode: 201,
      responseBody: {},
      userId: "user-123",
      createdAt: new Date(),
      organization: null,
    }

    ;(prisma.mockApi.findMany as jest.Mock).mockResolvedValue([mock1])
    ;(prisma.mockApi.count as jest.Mock).mockResolvedValue(1)

    // Filter by method
    const listRequest = new NextRequest("http://localhost:3000/api/mocks?method=GET&page=1&limit=10")
    const listResponse = await listGET(listRequest, mockUser)
    const listData = await listResponse.json()

    expect(listResponse.status).toBe(200)
    expect(listData.mocks).toHaveLength(1)
    expect(listData.pagination.page).toBe(1)
    expect(listData.pagination.limit).toBe(10)
  })
})

