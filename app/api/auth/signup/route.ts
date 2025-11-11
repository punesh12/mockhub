import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email } = body

    // Validate request body
    if (!id || !name || !email) {
      return NextResponse.json(
        { error: "User ID, name, and email are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Create user record in our database (linked to Supabase Auth user)
    try {
      // Create user in database - password is optional (Supabase handles auth)
      const user = await prisma.user.create({
        data: {
          id, // Use Supabase Auth user ID from frontend
          name,
          email,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      })

      return NextResponse.json(
        {
          message: "User created successfully in database",
          user,
        },
        { status: 201 }
      )
    } catch (dbError: any) {
      console.error("Database error:", dbError)

      // Check if it's a unique constraint error (user already exists)
      if (dbError.code === "P2002") {
        // User already exists in database, return existing user
        const existingUser = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        })

        if (existingUser) {
          return NextResponse.json(
            {
              message: "User already exists",
              user: existingUser,
            },
            { status: 200 }
          )
        }

        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          error: "Failed to create user record",
          details:
            process.env.NODE_ENV === "development"
              ? dbError.message || "Unknown database error"
              : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    )
  }
}
