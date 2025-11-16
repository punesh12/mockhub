import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export const GET = withAuth(async (request, user) => {

    // Ensure user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      // User exists in Supabase Auth but not in our database
      // Create the user record automatically
      if (!user.email) {
        return NextResponse.json(
          { error: "User email is missing. Please log out and log in again." },
          { status: 400 }
        )
      }

      try {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            name:
              user.user_metadata?.name || user.email?.split("@")[0] || "User",
            email: user.email,
            password: "",
          },
        })
      } catch (createError: unknown) {
        console.error("Error creating user in database:", createError)
        const errorCode =
          createError &&
          typeof createError === "object" &&
          "code" in createError
            ? String(createError.code)
            : undefined
        if (errorCode !== "P2002") {
          return NextResponse.json(
            { error: "Failed to create user record" },
            { status: 500 }
          )
        }
        // If user already exists, fetch it
        dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        })
        if (!dbUser) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
      }
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit
    const method = searchParams.get("method")?.toUpperCase()
    const status = searchParams.get("status")
      ? parseInt(searchParams.get("status")!)
      : null
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build where clause
    const where: Prisma.RequestHistoryWhereInput = {
      userId: user.id,
    }

    if (method) {
      where.method = method
    }

    if (status !== null) {
      where.status = status
    }

    if (search) {
      where.url = {
        contains: search,
        mode: "insensitive",
      }
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        // Add one day to include the entire end date
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Build orderBy
    const orderBy: Prisma.RequestHistoryOrderByWithRelationInput = {}
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder === "asc" ? "asc" : "desc"
    } else if (sortBy === "method") {
      orderBy.method = sortOrder === "asc" ? "asc" : "desc"
    } else if (sortBy === "status") {
      orderBy.status = sortOrder === "asc" ? "asc" : "desc"
    } else if (sortBy === "responseTime") {
      orderBy.responseTime = sortOrder === "asc" ? "asc" : "desc"
    } else {
      orderBy.createdAt = "desc" // Default
    }

    // Fetch history with pagination
    // Only calculate statistics if no filters are applied (for performance)
    const shouldCalculateStats =
      !method && status === null && !search && !startDate && !endDate

    const [history, total, statsData] = await Promise.all([
      prisma.requestHistory.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          url: true,
          method: true,
          status: true,
          responseTime: true,
          responseBody: true,
          createdAt: true,
        },
      }),
      prisma.requestHistory.count({ where }),
      // Use aggregation queries for statistics (much faster than fetching all records)
      shouldCalculateStats
        ? Promise.all([
            prisma.requestHistory.aggregate({
              where: { userId: user.id },
              _count: { id: true },
              _avg: { responseTime: true },
            }),
            prisma.requestHistory.count({
              where: {
                userId: user.id,
                status: { gte: 200, lt: 300 },
              },
            }),
          ])
        : Promise.resolve([null, null]),
    ])

    // Calculate statistics using aggregated data
    let statistics = null
    if (shouldCalculateStats && statsData[0] && statsData[1] !== null) {
      const [aggregate, successCount] = statsData
      const totalCount = aggregate._count.id
      const avgResponseTime = aggregate._avg.responseTime || 0
      const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0

      statistics = {
        total: totalCount,
        successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
        avgResponseTime: Math.round(avgResponseTime * 10) / 10, // Round to 1 decimal
        successCount,
        errorCount: totalCount - successCount,
      }
    }

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statistics,
    })
})
