// Centralized authentication wrapper for API routes

import { NextRequest, NextResponse } from "next/server"
import { getServerUser } from "@/lib/supabase-auth"
import { AuthenticationError } from "./errors"
import { handleApiError } from "./error-handler"
import type { User } from "@supabase/supabase-js"

/**
 * Wrapper for authenticated API route handlers
 * Automatically checks authentication and passes user to handler
 * 
 * @example
 * export const GET = withAuth(async (request, user) => {
 *   // user is guaranteed to be authenticated here
 *   return NextResponse.json({ data: "..." })
 * })
 */
export function withAuth<T extends any[]>(
  handler: (
    request: NextRequest,
    user: User,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await getServerUser()

      if (!user) {
        throw new AuthenticationError("Unauthorized")
      }

      return await handler(request, user, ...args)
    } catch (error) {
      return handleApiError(error, request)
    }
  }
}

/**
 * Wrapper for authenticated API route handlers with params
 * Automatically checks authentication and passes user to handler
 * 
 * @example
 * export const GET = withAuthParams(async (request, { id }, user) => {
 *   // user is guaranteed to be authenticated here
 *   return NextResponse.json({ data: "..." })
 * })
 */
export function withAuthParams<
  TParams extends Record<string, string>,
  T extends any[]
>(
  handler: (
    request: NextRequest,
    params: TParams,
    user: User,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<TParams> },
    ...args: T
  ): Promise<NextResponse> => {
    try {
      const user = await getServerUser()

      if (!user) {
        throw new AuthenticationError("Unauthorized")
      }

      const resolvedParams = await params
      return await handler(request, resolvedParams, user, ...args)
    } catch (error) {
      return handleApiError(error, request)
    }
  }
}

/**
 * Get authenticated user (throws if not authenticated)
 * Use this inside route handlers that are already wrapped with withAuth
 * or when you need to get user in a non-wrapped context
 */
export async function requireAuth(): Promise<User> {
  const user = await getServerUser()
  if (!user) {
    throw new AuthenticationError("Unauthorized")
  }
  return user
}

