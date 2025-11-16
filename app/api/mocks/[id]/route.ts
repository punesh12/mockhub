import { NextResponse } from "next/server"
import { withAuthParams } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

/**
 * GET /api/mocks/[id] - Get a single mock by ID
 */
export const GET = withAuthParams(async (request, { id }, user) => {

    // Find the mock
    const mock = await prisma.mockApi.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      } as Prisma.MockApiInclude,
    })

    if (!mock) {
      return NextResponse.json({ error: "Mock not found" }, { status: 404 })
    }

    // Verify user owns the mock
    if (mock.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You don't have access to this mock" },
        { status: 403 }
      )
    }

  return NextResponse.json({ mock })
})

/**
 * PUT /api/mocks/[id] - Update a mock
 */
export const PUT = withAuthParams(async (request, { id }, user) => {
    // Find the mock first
    const existingMock = await prisma.mockApi.findUnique({
      where: { id },
    })

    if (!existingMock) {
      return NextResponse.json({ error: "Mock not found" }, { status: 404 })
    }

    // Verify user owns the mock
    if (existingMock.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You don't have access to this mock" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate and sanitize input using Yup validation + sanitization
    const { validateAndSanitizeMockApiUpdate } = await import("@/lib/input-security")
    const validationResult = await validateAndSanitizeMockApiUpdate(body)

    if (!validationResult.success) {
      return validationResult.error
    }

    const { name, endpoint, method, responseCode, responseBody } = validationResult.data
    const code = responseCode || existingMock.responseCode
    const parsedResponseBody = responseBody !== undefined ? responseBody : existingMock.responseBody
    
    // Use existing values if not provided in update
    const finalName = name || existingMock.name
    const finalEndpoint = endpoint || existingMock.endpoint
    const finalMethod = method || existingMock.method

    // Check if endpoint/method combination already exists for another mock
    if (
      finalEndpoint !== existingMock.endpoint ||
      finalMethod.toUpperCase() !== existingMock.method
    ) {
      const duplicateMock = await prisma.mockApi.findFirst({
        where: {
          userId: user.id,
          endpoint: finalEndpoint,
          method: finalMethod.toUpperCase(),
          id: { not: id }, // Exclude current mock
        },
      })

      if (duplicateMock) {
        return NextResponse.json(
          { error: "A mock with this endpoint and method already exists" },
          { status: 400 }
        )
      }
    }

    // Update the mock
    const updatedMock = await prisma.mockApi.update({
      where: { id },
      data: {
        name: finalName,
        endpoint: finalEndpoint,
        method: finalMethod.toUpperCase(),
        responseCode: code,
        responseBody: parsedResponseBody as Prisma.InputJsonValue,
      } as unknown as Prisma.MockApiUpdateInput,
      select: {
        id: true,
        name: true,
        endpoint: true,
        method: true,
        responseCode: true,
        responseBody: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      } as Prisma.MockApiSelect,
    })

    return NextResponse.json({
      message: "Mock updated successfully",
      mock: updatedMock,
    })
})

/**
 * DELETE /api/mocks/[id] - Delete a mock
 */
export const DELETE = withAuthParams(async (request, { id }, user) => {

    // Find the mock first
    const mock = await prisma.mockApi.findUnique({
      where: { id },
    })

    if (!mock) {
      return NextResponse.json({ error: "Mock not found" }, { status: 404 })
    }

    // Verify user owns the mock
    if (mock.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You don't have access to this mock" },
        { status: 403 }
      )
    }

    // Delete the mock
    await prisma.mockApi.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Mock deleted successfully",
    })
})
