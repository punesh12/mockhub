import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

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

    // Get all history for charts (last 30 days or all if less)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const history = await prisma.requestHistory.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        status: true,
        responseTime: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Process data for charts
    const dateMap = new Map<
      string,
      {
        responseTimes: number[]
        successful: number
        failed: number
        total: number
      }
    >()

    const statusMap = new Map<number, number>()

    history.forEach((item) => {
      // Group by date
      const date = new Date(item.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          responseTimes: [],
          successful: 0,
          failed: 0,
          total: 0,
        })
      }

      const dateData = dateMap.get(date)!
      dateData.responseTimes.push(item.responseTime)
      dateData.total++

      if (item.status >= 200 && item.status < 300) {
        dateData.successful++
      } else {
        dateData.failed++
      }

      // Count status codes
      statusMap.set(item.status, (statusMap.get(item.status) || 0) + 1)
    })

    // Format response time data
    const responseTimeData = Array.from(dateMap.entries()).map(
      ([date, data]) => ({
        date,
        avgResponseTime: Math.round(
          data.responseTimes.reduce((sum, time) => sum + time, 0) /
            data.responseTimes.length
        ),
        minResponseTime: Math.min(...data.responseTimes),
        maxResponseTime: Math.max(...data.responseTimes),
      })
    )

    // Format request volume data
    const requestVolumeData = Array.from(dateMap.entries()).map(
      ([date, data]) => ({
        date,
        requests: data.total,
        successful: data.successful,
        failed: data.failed,
      })
    )

    // Format status code data
    const statusCodeData = Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status: status.toString(),
        count,
      }))
      .sort((a, b) => parseInt(a.status) - parseInt(b.status))

    return NextResponse.json({
      responseTime: responseTimeData,
      requestVolume: requestVolumeData,
      statusCode: statusCodeData,
    })
})
