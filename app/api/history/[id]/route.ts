import { NextRequest, NextResponse } from "next/server"
import { withAuthParams } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * DELETE /api/history/[id] - Delete a request history item
 */
export const DELETE = withAuthParams(async (request, { id }, user) => {

    // Check if the history item exists and belongs to the user
    const historyItem = await prisma.requestHistory.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!historyItem) {
      return NextResponse.json(
        { error: "History item not found" },
        { status: 404 }
      )
    }

    if (historyItem.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete the history item
    await prisma.requestHistory.delete({
      where: { id },
    })

  return NextResponse.json({
    message: "History item deleted successfully",
  })
})
