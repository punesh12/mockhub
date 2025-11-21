import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { getServerSupabase } from "@/lib/supabase-auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/user/profile - Get user profile
 */
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
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          createdAt: new Date().toISOString(),
        },
      })
    }

  return NextResponse.json({ user: dbUser })
})

/**
 * PUT /api/user/profile - Update user profile
 */
export const PUT = withAuth(async (request, user) => {

    const body = await request.json()

    // Validate and sanitize input using Yup validation + sanitization
    const { validateAndSanitizeProfileUpdate } = await import("@/lib/input-security")
    const validationResult = await validateAndSanitizeProfileUpdate(body)

    if (!validationResult.success) {
      return validationResult.error
    }

    const { name, email } = validationResult.data

    // Ensure at least one field is provided
    if (!name && !email) {
      return NextResponse.json(
        { error: "At least name or email must be provided" },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user (if email is being updated)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 400 }
        )
      }
    }

    // Get existing user to use as fallback for create
    const existingDbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    })

    // Prepare update data (only include fields that are provided)
    const updateData: { name?: string; email?: string } = {}
    if (name !== undefined) {
      updateData.name = name
    }
    if (email !== undefined) {
      updateData.email = email
    }

    // Update user in database
    const updatedUser = await prisma.user.upsert({
      where: { id: user.id },
      update: updateData,
      create: {
        id: user.id,
        name: name || existingDbUser?.name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
        email: email || existingDbUser?.email || user.email || "",
        password: "",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    // Update user metadata in Supabase Auth
    const supabase = await getServerSupabase()
    await supabase.auth.updateUser({
      data: {
        name: name,
      },
    })

    // If email changed, update it in Supabase Auth
    if (email !== user.email) {
      await supabase.auth.updateUser({
        email: email,
      })
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
})
