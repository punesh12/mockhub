/**
 * Tests for /api/auth/logout route
 */

import { POST } from "@/app/api/auth/logout/route"
import { getServerSupabase } from "@/lib/supabase-auth"
import { cookies } from "next/headers"

// Mock dependencies
jest.mock("@/lib/supabase-auth", () => ({
  getServerSupabase: jest.fn(),
}))

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}))

describe("POST /api/auth/logout", () => {
  const mockSupabase = {
    auth: {
      signOut: jest.fn(),
    },
  }

  const mockCookieStore = {
    delete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSupabase as jest.Mock).mockResolvedValue(mockSupabase)
    ;(cookies as jest.Mock).mockResolvedValue(mockCookieStore)
  })

  it("should logout successfully and clear cookies", async () => {
    ;(mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Logged out successfully")
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    expect(mockCookieStore.delete).toHaveBeenCalledWith("sb-access-token")
    expect(mockCookieStore.delete).toHaveBeenCalledWith("sb-refresh-token")
  })

  it("should handle signOut errors gracefully and still clear cookies", async () => {
    ;(mockSupabase.auth.signOut as jest.Mock).mockRejectedValue(
      new Error("Sign out failed")
    )

    const response = await POST()
    const data = await response.json()

    // Should still return success if cookies are cleared, even if signOut fails
    expect(response.status).toBe(200)
    expect(data.message).toBe("Logged out successfully")
    // Cookies should still be cleared
    expect(mockCookieStore.delete).toHaveBeenCalledWith("sb-access-token")
    expect(mockCookieStore.delete).toHaveBeenCalledWith("sb-refresh-token")
  })

  it("should still clear cookies even if signOut fails", async () => {
    ;(mockSupabase.auth.signOut as jest.Mock).mockRejectedValue(
      new Error("Sign out failed")
    )

    await POST()

    // Cookies should still be cleared
    expect(mockCookieStore.delete).toHaveBeenCalledWith("sb-access-token")
    expect(mockCookieStore.delete).toHaveBeenCalledWith("sb-refresh-token")
  })
})

