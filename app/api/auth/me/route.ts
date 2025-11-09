import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export const GET = withAuth(async (request, user) => {

    // Get user details from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    if (!dbUser) {
      // Return auth user if not in database yet
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.name || user.email || "",
        },
      })
    }

  return NextResponse.json({ user: dbUser })
})
