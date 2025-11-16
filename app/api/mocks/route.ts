import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { isValidHttpMethod, isCommonHttpMethod } from "@/lib/http-methods"
import {
  checkOrganizationAccess,
  canCreateMockInOrganization,
} from "@/lib/organization-auth"

export const GET = withAuth(async (request, user) => {

    // Get query parameters for pagination, filtering, and sorting
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const skip = (page - 1) * limit
    const search = searchParams.get("search") || ""
    const method = searchParams.get("method") || ""
    const statusCode = searchParams.get("statusCode") || ""
    const organizationId = searchParams.get("organizationId") || ""
    const personalOnly = searchParams.get("personalOnly") === "true"
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build where clause
    let where: Prisma.MockApiWhereInput

    // If personalOnly is true, only show personal mocks
    if (personalOnly) {
      where = {
        userId: user.id,
        organizationId: null,
      } as Prisma.MockApiWhereInput
    } else if (organizationId) {
      // If organizationId is specified, filter by it and check access
      const access = await checkOrganizationAccess(user.id, organizationId)
      if (!access.hasAccess) {
        return NextResponse.json(
          { error: "Organization not found or access denied" },
          { status: 404 }
        )
      }
      // Override where clause to only include this organization's mocks
      where = {
        organizationId,
        organization: {
          OR: [
            { ownerId: user.id },
            {
              members: {
                some: {
                  userId: user.id,
                },
              },
            },
            { visibility: "public" },
          ],
        },
      } as Prisma.MockApiWhereInput
    } else {
      // Default: Include personal mocks and organization mocks user has access to
      where = {
        OR: [
          // Personal mocks
          { userId: user.id, organizationId: null } as Prisma.MockApiWhereInput,
          // Organization mocks (user must be member)
          {
            organizationId: { not: null },
            organization: {
              OR: [
                { ownerId: user.id },
                {
                  members: {
                    some: {
                      userId: user.id,
                    },
                  },
                },
                { visibility: "public" },
              ],
            },
          } as Prisma.MockApiWhereInput,
        ],
      }
    }

    // Add search filter
    if (search) {
      where.AND = [
        ...((where.AND || []) as Prisma.MockApiWhereInput[]),
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { endpoint: { contains: search, mode: "insensitive" } },
          ],
        },
      ]
    }

    // Add method filter
    if (method) {
      where.method = method.toUpperCase()
    }

    // Add status code filter
    if (statusCode) {
      where.responseCode = parseInt(statusCode)
    }

    // Build orderBy clause
    const orderBy: Prisma.MockApiOrderByWithRelationInput = {}
    const sortOrderValue = sortOrder === "asc" ? "asc" : "desc"
    if (sortBy === "name") {
      orderBy.name = sortOrderValue
    } else if (sortBy === "method") {
      orderBy.method = sortOrderValue
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrderValue
    } else {
      orderBy.createdAt = "desc" // Default
    }

    // Fetch mocks for the user
    const [mocks, total] = await Promise.all([
      prisma.mockApi.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          endpoint: true,
          method: true,
          responseCode: true,
          createdAt: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        } as Prisma.MockApiSelect,
      }),
      prisma.mockApi.count({
        where,
      }),
    ])

    return NextResponse.json({
      mocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
})

export const POST = withAuth(async (request, user) => {

    // Log user info for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 User from Supabase Auth:", {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        hasEmail: !!user.email,
      })
    }

    // Ensure user exists in database (create if missing)
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      // User exists in Supabase Auth but not in our database
      // Check if user with this email already exists

      // Validate user data before creating
      if (!user.email) {
        console.error("User email is missing:", user)
        return NextResponse.json(
          { error: "User email is missing. Please log out and log in again." },
          { status: 400 }
        )
      }

      // Check if a user with this email already exists
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: user.email },
      })

      if (existingUserByEmail) {
        // User with this email exists but with different ID
        // This can happen if user was created manually or with different auth provider
        // We need to migrate the data from old user to new user
        console.log(
          "⚠️ User with email exists but different ID. Migrating data..."
        )
        console.log("  Existing user ID:", existingUserByEmail.id)
        console.log("  Supabase Auth user ID:", user.id)

        try {
          // Get all related data before deleting
          const [mocks, history] = await Promise.all([
            prisma.mockApi.findMany({
              where: { userId: existingUserByEmail.id },
            }),
            prisma.requestHistory.findMany({
              where: { userId: existingUserByEmail.id },
            }),
          ])

          // Create new user with correct ID
          dbUser = await prisma.user.create({
            data: {
              id: user.id,
              name:
                user.user_metadata?.name ||
                existingUserByEmail.name ||
                user.email?.split("@")[0] ||
                "User",
              email: user.email,
              password: "", // Empty string - Supabase handles authentication
            },
          })

          // Migrate mocks to new user ID
          if (mocks.length > 0) {
            await Promise.all(
              mocks.map((mock) =>
                prisma.mockApi.update({
                  where: { id: mock.id },
                  data: { userId: user.id },
                })
              )
            )
            console.log(`  ✅ Migrated ${mocks.length} mock(s)`)
          }

          // Migrate history to new user ID
          if (history.length > 0) {
            await Promise.all(
              history.map((h) =>
                prisma.requestHistory.update({
                  where: { id: h.id },
                  data: { userId: user.id },
                })
              )
            )
            console.log(`  ✅ Migrated ${history.length} history record(s)`)
          }

          // Delete old user record (now safe since data is migrated)
          await prisma.user.delete({
            where: { id: existingUserByEmail.id },
          })

          console.log(
            "✅ Successfully migrated user data to new ID:",
            dbUser.id
          )
        } catch (updateError: unknown) {
          console.error("❌ Error migrating user data:", updateError)
          const errorMessage =
            updateError instanceof Error
              ? updateError.message
              : "Unknown error"
          return NextResponse.json(
            {
              error: "Account migration failed. Please contact support.",
              details:
                process.env.NODE_ENV === "development"
                  ? `Error: ${errorMessage}`
                  : undefined,
            },
            { status: 500 }
          )
        }
      } else {
        // No user with this email exists, create new user
        try {
          dbUser = await prisma.user.create({
            data: {
              id: user.id,
              name:
                user.user_metadata?.name || user.email?.split("@")[0] || "User",
              email: user.email,
              password: "", // Empty string - Supabase handles authentication
            },
          })
          console.log("✅ Created user in database:", dbUser.id)
        } catch (createError: unknown) {
          console.error("❌ Error creating user in database:")
          const errorCode =
            createError && typeof createError === "object" && "code" in createError
              ? String(createError.code)
              : undefined
          const errorMessage =
            createError instanceof Error
              ? createError.message
              : "Unknown error"
          console.error("  Error code:", errorCode)
          console.error("  Error message:", errorMessage)
          console.error("  User ID:", user.id)
          console.error("  User email:", user.email)
          console.error("  Full error:", createError)

          // If creation fails, return error
          if (errorCode === "P2002") {
            // Unique constraint violation - user might have been created by another request
            console.log(
              "  → User might already exist, trying to fetch again..."
            )
            dbUser = await prisma.user.findUnique({
              where: { id: user.id },
            })
            if (!dbUser) {
              return NextResponse.json(
                {
                  error: "Failed to create user record. Please try again.",
                  details:
                    process.env.NODE_ENV === "development"
                      ? errorMessage
                      : undefined,
                },
                { status: 500 }
              )
            }
            console.log("  ✅ Found existing user after retry")
          } else if (errorCode === "P2003") {
            // Foreign key constraint - shouldn't happen for User creation
            return NextResponse.json(
              {
                error: "Database constraint error. Please contact support.",
                details:
                  process.env.NODE_ENV === "development"
                    ? errorMessage
                    : undefined,
              },
              { status: 500 }
            )
          } else {
            return NextResponse.json(
              {
                error: "Failed to create user record. Please try again.",
                details:
                  process.env.NODE_ENV === "development"
                    ? `${errorCode || "Unknown"}: ${errorMessage}`
                    : undefined,
              },
              { status: 500 }
            )
          }
        }
      }
    }

    const body = await request.json()
    const { name, endpoint, method, responseCode, responseBody, organizationId } = body

    // Validate request body
    if (!name || !endpoint || !method) {
      return NextResponse.json(
        { error: "Name, endpoint, and method are required" },
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

    // If organizationId is provided, validate access
    if (organizationId) {
      const canCreate = await canCreateMockInOrganization(user.id, organizationId)
      if (!canCreate) {
        return NextResponse.json(
          { error: "You don't have permission to create mocks in this organization" },
          { status: 403 }
        )
      }
    }

    // Check if endpoint already exists
    // For personal mocks: check userId + endpoint + method
    // For organization mocks: check organizationId + endpoint + method
    const existingMock = await prisma.mockApi.findFirst({
      where: (organizationId
        ? {
            organizationId,
            endpoint: endpoint,
            method: method.toUpperCase(),
          }
        : {
            userId: user.id,
            organizationId: null,
            endpoint: endpoint,
            method: method.toUpperCase(),
          }) as unknown as Prisma.MockApiWhereInput,
    })

    if (existingMock) {
      return NextResponse.json(
        { error: "A mock with this endpoint and method already exists" },
        { status: 400 }
      )
    }

    // Create mock API
    const mock = await prisma.mockApi.create({
      data: {
        userId: user.id,
        organizationId: organizationId || null,
        name,
        endpoint,
        method: method.toUpperCase(),
        responseCode: code,
        responseBody: responseBody || {},
      } as unknown as Prisma.MockApiCreateInput,
      select: {
        id: true,
        name: true,
        endpoint: true,
        method: true,
        responseCode: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      } as Prisma.MockApiSelect,
    })

    return NextResponse.json(
      {
        message: "Mock API created successfully",
        mock,
      },
      { status: 201 }
    )
})
