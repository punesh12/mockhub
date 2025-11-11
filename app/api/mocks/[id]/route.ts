import { NextRequest, NextResponse } from "next/server"
import { withAuthParams } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { isValidHttpMethod, isCommonHttpMethod } from "@/lib/http-methods"

/**
 * GET /api/mocks/[id] - Get a single mock by ID
 */
export const GET = withAuthParams(async (request, { id }, user) => {

    // Find the mock
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

  return NextResponse.json({ mock })
})

/**
 * PUT /api/mocks/[id] - Update a mock
 */
export const PUT = withAuthParams(async (request, { id }, user) => {
    const body = await request.json()
    const { name, endpoint, method, responseCode, responseBody } = body

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

    // Validate request body
    if (!name || !endpoint || !method || !responseBody) {
      return NextResponse.json(
        { error: "Name, endpoint, method, and responseBody are required" },
        { status: 400 }
      )
    }

    // Validate endpoint format
    if (!endpoint.startsWith("/")) {
      return NextResponse.json(
        { error: "Endpoint must start with /" },
        { status: 400 }
      )
    }

    // Validate HTTP method
    if (!isValidHttpMethod(method) || !isCommonHttpMethod(method)) {
      return NextResponse.json(
        { error: "Invalid HTTP method" },
        { status: 400 }
      )
    }

    // Validate response code
    const code = responseCode || 200
    if (code < 100 || code > 599) {
      return NextResponse.json(
        { error: "Invalid response code" },
        { status: 400 }
      )
    }

    // Validate JSON response body
    try {
      JSON.parse(responseBody)
    } catch (jsonError) {
      return NextResponse.json(
        { error: "Response body must be valid JSON" },
        { status: 400 }
      )
    }

    // Check if endpoint/method combination already exists for another mock
    if (
      endpoint !== existingMock.endpoint ||
      method.toUpperCase() !== existingMock.method
    ) {
      const duplicateMock = await prisma.mockApi.findFirst({
        where: {
          userId: user.id,
          endpoint: endpoint,
          method: method.toUpperCase(),
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
        name,
        endpoint,
        method: method.toUpperCase(),
        responseCode: code,
        responseBody: JSON.parse(responseBody), // Store as JSON
      },
      select: {
        id: true,
        name: true,
        endpoint: true,
        method: true,
        responseCode: true,
        responseBody: true,
        createdAt: true,
      },
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
