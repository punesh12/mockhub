import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (request, user) => {

    // Get query parameters for pagination, filtering, and sorting
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const skip = (page - 1) * limit
    const search = searchParams.get("search") || ""
    const method = searchParams.get("method") || ""
    const statusCode = searchParams.get("statusCode") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build where clause
    const where: any = {
      userId: user.id,
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { endpoint: { contains: search, mode: "insensitive" } },
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
    const orderBy: any = {}
    if (sortBy === "name") {
      orderBy.name = sortOrder
    } else if (sortBy === "method") {
      orderBy.method = sortOrder
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder
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
        } catch (updateError: any) {
          console.error("❌ Error migrating user data:", updateError)
          return NextResponse.json(
            {
              error: "Account migration failed. Please contact support.",
              details:
                process.env.NODE_ENV === "development"
                  ? `Error: ${updateError.message || "Unknown error"}`
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
        } catch (createError: any) {
          console.error("❌ Error creating user in database:")
          console.error("  Error code:", createError.code)
          console.error("  Error message:", createError.message)
          console.error("  User ID:", user.id)
          console.error("  User email:", user.email)
          console.error("  Full error:", createError)

          // If creation fails, return error
          if (createError.code === "P2002") {
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
                      ? createError.message
                      : undefined,
                },
                { status: 500 }
              )
            }
            console.log("  ✅ Found existing user after retry")
          } else if (createError.code === "P2003") {
            // Foreign key constraint - shouldn't happen for User creation
            return NextResponse.json(
              {
                error: "Database constraint error. Please contact support.",
                details:
                  process.env.NODE_ENV === "development"
                    ? createError.message
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
                    ? `${createError.code || "Unknown"}: ${createError.message || "Unknown error"}`
                    : undefined,
              },
              { status: 500 }
            )
          }
        }
      }
    }

    const body = await request.json()
    const { name, endpoint, method, responseCode, responseBody } = body

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
    const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"]
    if (!validMethods.includes(method.toUpperCase())) {
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

    // Check if endpoint already exists for this user
    const existingMock = await prisma.mockApi.findFirst({
      where: {
        userId: user.id,
        endpoint: endpoint,
        method: method.toUpperCase(),
      },
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
        name,
        endpoint,
        method: method.toUpperCase(),
        responseCode: code,
        responseBody: responseBody,
      },
      select: {
        id: true,
        name: true,
        endpoint: true,
        method: true,
        responseCode: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: "Mock API created successfully",
        mock,
      },
      { status: 201 }
    )
})
