import { NextRequest, NextResponse } from "next/server"

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}, 5 * 60 * 1000)

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
    message: "Too many authentication attempts. Please try again later.",
  },
  // API endpoints - moderate limits
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: "Too many requests. Please slow down.",
  },
  // Mock API execution - more lenient
  MOCK_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: "Rate limit exceeded. Please try again later.",
  },
  // API testing endpoint - moderate limits
  API_TEST: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: "Too many test requests. Please slow down.",
  },
  // General endpoints
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: "Rate limit exceeded. Please try again later.",
  },
} as const

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
function getRateLimitKey(request: NextRequest, userId?: string): string {
  // Prefer user ID if available (more accurate for authenticated users)
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown"

  return `ip:${ip}`
}

/**
 * Check if request exceeds rate limit
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = getRateLimitKey(request, userId)
  const now = Date.now()

  // Get or create entry
  let entry = store[key]

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    store[key] = entry
  }

  // Increment count
  entry.count++

  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function withRateLimit<T extends unknown[]>(
  config: RateLimitConfig,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Try to get user ID from request if available
    // This would need to be passed from the auth wrapper
    const userId = (args[0] as { user?: { id: string } } | undefined)?.user?.id

    const { allowed, remaining, resetTime } = checkRateLimit(request, config, userId)

    if (!allowed) {
      const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000)

      return NextResponse.json(
        {
          error: config.message || "Rate limit exceeded",
          retryAfter: resetSeconds,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": resetTime.toString(),
            "Retry-After": resetSeconds.toString(),
          },
        }
      )
    }

    // Add rate limit headers to response
    const response = await handler(request, ...args)

    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString())
    response.headers.set("X-RateLimit-Remaining", remaining.toString())
    response.headers.set("X-RateLimit-Reset", resetTime.toString())

    return response
  }
}

/**
 * Rate limit check function that returns a response if limit exceeded
 */
export function rateLimitCheck(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): NextResponse | null {
  const { allowed, remaining, resetTime } = checkRateLimit(request, config, userId)

  if (!allowed) {
    const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000)

    return NextResponse.json(
      {
        error: config.message || "Rate limit exceeded",
        retryAfter: resetSeconds,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": resetTime.toString(),
          "Retry-After": resetSeconds.toString(),
        },
      }
    )
  }

  return null
}

