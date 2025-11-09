import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/dashboard/stats - Get dashboard statistics
 */
export const GET = withAuth(async (request, user) => {

    // Ensure user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
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
        if (createError.code !== "P2002") {
          return NextResponse.json(
            { error: "Failed to create user record" },
            { status: 500 }
          )
        }
        dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        })
        if (!dbUser) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
      }
    }

    // Fetch statistics in parallel
    const [totalMocks, totalHistory, historyItems] = await Promise.all([
      prisma.mockApi.count({
        where: { userId: user.id },
      }),
      prisma.requestHistory.count({
        where: { userId: user.id },
      }),
      prisma.requestHistory.findMany({
        where: { userId: user.id },
        select: {
          status: true,
        },
      }),
    ])

    // Calculate success rate
    const successCount = historyItems.filter(
      (h) => h.status >= 200 && h.status < 300
    ).length
    const successRate =
      historyItems.length > 0
        ? Math.round((successCount / historyItems.length) * 100 * 10) / 10
        : 0

    // Active endpoints (mocks with unique endpoint/method combinations)
    const activeEndpoints = await prisma.mockApi.groupBy({
      by: ["endpoint", "method"],
      where: { userId: user.id },
      _count: true,
    })

    return NextResponse.json({
      stats: {
        totalMocks,
        totalHistory,
        successRate,
        activeEndpoints: activeEndpoints.length,
      },
    })
})
