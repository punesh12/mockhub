// Centralized authentication wrapper for API routes

import { NextRequest, NextResponse } from "next/server"
import { getServerUser } from "@/lib/supabase-auth"
import { AuthenticationError } from "./errors"
import { handleApiError } from "./error-handler"
import { rateLimitCheck, RATE_LIMITS, type RateLimitConfig } from "./rate-limit"
import type { User } from "@supabase/supabase-js"

/**
 * Wrapper for authenticated API route handlers
 * Automatically checks authentication, rate limiting, and passes user to handler
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
  ) => Promise<NextResponse>,
  rateLimitConfig: RateLimitConfig = RATE_LIMITS.API
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Check rate limit first
      const rateLimitResponse = rateLimitCheck(request, rateLimitConfig)
      if (rateLimitResponse) {
        return rateLimitResponse
      }

      const user = await getServerUser()

      if (!user) {
        throw new AuthenticationError("Unauthorized")
      }

      const response = await handler(request, user, ...args)
      
      // Add rate limit headers
      const { checkRateLimit } = await import("./rate-limit")
      const { remaining, resetTime } = checkRateLimit(request, rateLimitConfig, user.id)
      response.headers.set("X-RateLimit-Limit", rateLimitConfig.maxRequests.toString())
      response.headers.set("X-RateLimit-Remaining", remaining.toString())
      response.headers.set("X-RateLimit-Reset", resetTime.toString())

      return response
    } catch (error) {
      return handleApiError(error, request)
    }
  }
}

/**
 * Wrapper for authenticated API route handlers with params
 * Automatically checks authentication, rate limiting, and passes user to handler
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
  ) => Promise<NextResponse>,
  rateLimitConfig: RateLimitConfig = RATE_LIMITS.API
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<TParams> },
    ...args: T
  ): Promise<NextResponse> => {
    try {
      // Check rate limit first
      const rateLimitResponse = rateLimitCheck(request, rateLimitConfig)
      if (rateLimitResponse) {
        return rateLimitResponse
      }

      const user = await getServerUser()

      if (!user) {
        throw new AuthenticationError("Unauthorized")
      }

      const resolvedParams = await params
      const response = await handler(request, resolvedParams, user, ...args)
      
      // Add rate limit headers
      const { checkRateLimit } = await import("./rate-limit")
      const { remaining, resetTime } = checkRateLimit(request, rateLimitConfig, user.id)
      response.headers.set("X-RateLimit-Limit", rateLimitConfig.maxRequests.toString())
      response.headers.set("X-RateLimit-Remaining", remaining.toString())
      response.headers.set("X-RateLimit-Reset", resetTime.toString())

      return response
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

/**
 * Wrapper for optionally authenticated API route handlers
 * Allows public access but provides user if authenticated
 * Includes rate limiting
 * 
 * @example
 * export const GET = withOptionalAuth(async (request, user) => {
 *   // user may be null for unauthenticated requests
 *   return NextResponse.json({ data: "..." })
 * })
 */
export function withOptionalAuth<T extends any[]>(
  handler: (
    request: NextRequest,
    user: User | null,
    ...args: T
  ) => Promise<NextResponse>,
  rateLimitConfig: RateLimitConfig = RATE_LIMITS.API
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Check rate limit first
      const rateLimitResponse = rateLimitCheck(request, rateLimitConfig)
      if (rateLimitResponse) {
        return rateLimitResponse
      }

      const user = await getServerUser()
      const response = await handler(request, user, ...args)
      
      // Add rate limit headers
      const { checkRateLimit } = await import("./rate-limit")
      const { remaining, resetTime } = checkRateLimit(request, rateLimitConfig, user?.id)
      response.headers.set("X-RateLimit-Limit", rateLimitConfig.maxRequests.toString())
      response.headers.set("X-RateLimit-Remaining", remaining.toString())
      response.headers.set("X-RateLimit-Reset", resetTime.toString())

      return response
    } catch (error) {
      return handleApiError(error, request)
    }
  }
}

/**
 * Wrapper for optionally authenticated API route handlers with params
 * Allows public access but provides user if authenticated
 * Includes rate limiting
 * 
 * @example
 * export const GET = withOptionalAuthParams(async (request, { id }, user) => {
 *   // user may be null for unauthenticated requests
 *   return NextResponse.json({ data: "..." })
 * })
 */
export function withOptionalAuthParams<
  TParams extends Record<string, string>,
  T extends any[]
>(
  handler: (
    request: NextRequest,
    params: TParams,
    user: User | null,
    ...args: T
  ) => Promise<NextResponse>,
  rateLimitConfig: RateLimitConfig = RATE_LIMITS.API
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<TParams> },
    ...args: T
  ): Promise<NextResponse> => {
    try {
      // Check rate limit first
      const rateLimitResponse = rateLimitCheck(request, rateLimitConfig)
      if (rateLimitResponse) {
        return rateLimitResponse
      }

      const user = await getServerUser()
      const resolvedParams = await params
      const response = await handler(request, resolvedParams, user, ...args)
      
      // Add rate limit headers
      const { checkRateLimit } = await import("./rate-limit")
      const { remaining, resetTime } = checkRateLimit(request, rateLimitConfig, user?.id)
      response.headers.set("X-RateLimit-Limit", rateLimitConfig.maxRequests.toString())
      response.headers.set("X-RateLimit-Remaining", remaining.toString())
      response.headers.set("X-RateLimit-Reset", resetTime.toString())

      return response
    } catch (error) {
      return handleApiError(error, request)
    }
  }
}

