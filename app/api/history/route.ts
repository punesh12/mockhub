import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

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
      } catch (createError: any) {
        console.error("Error creating user in database:", createError)
        if (createError.code !== "P2002") {
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
    const where: any = {
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
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Fetch history with pagination
    const [history, total, allHistoryForStats] = await Promise.all([
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
      // Get all history for statistics (only if no filters applied for performance)
      !method && status === null && !search && !startDate && !endDate
        ? prisma.requestHistory.findMany({
            where: { userId: user.id },
            select: {
              status: true,
              responseTime: true,
            },
          })
        : Promise.resolve([]),
    ])

    // Calculate statistics
    let statistics = null
    if (allHistoryForStats.length > 0) {
      const successCount = allHistoryForStats.filter(
        (h) => h.status >= 200 && h.status < 300
      ).length
      const successRate = (successCount / allHistoryForStats.length) * 100
      const avgResponseTime =
        allHistoryForStats.reduce((sum, h) => sum + h.responseTime, 0) /
        allHistoryForStats.length

      statistics = {
        total: allHistoryForStats.length,
        successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
        avgResponseTime: Math.round(avgResponseTime * 10) / 10, // Round to 1 decimal
        successCount,
        errorCount: allHistoryForStats.length - successCount,
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
