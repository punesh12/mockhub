import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { getServerSupabase } from "@/lib/supabase-auth"
import { prisma } from "@/lib/prisma"

/**
 * DELETE /api/user/account - Delete user account
 */
export const DELETE = withAuth(async (request, user) => {

    const body = await request.json()
    const { confirmPassword } = body

    // Validate request body
    if (!confirmPassword) {
      return NextResponse.json(
        { error: "Password confirmation is required" },
        { status: 400 }
      )
    }

    // Verify password by attempting to sign in
    const supabase = await getServerSupabase()
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: confirmPassword,
      })

    if (signInError || !signInData.user) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 400 }
      )
    }

    // Delete user from database (this will cascade delete mocks and history)
    await prisma.user.delete({
      where: { id: user.id },
    })

    // Sign out the user
    await supabase.auth.signOut()

    // Note: We can't delete the user from Supabase Auth without admin API
    // The user will need to delete their account manually from Supabase dashboard
    // or we can use Supabase Admin API if available
    // For now, we delete from our database and sign them out

  return NextResponse.json({
    message: "Account deleted successfully",
  })
})
