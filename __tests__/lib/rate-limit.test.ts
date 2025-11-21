/**
 * Tests for rate limiting utilities
 */

import { checkRateLimit, RATE_LIMITS, rateLimitCheck } from "@/lib/rate-limit"

// Mock Date.now to control time in tests
const mockDateNow = jest.spyOn(Date, "now")

// Helper to create a mock NextRequest
const createMockRequest = (url: string, headers?: Record<string, string>) => {
  const headersObj = new Headers(headers)
  const urlObj = new URL(url)
  return {
    url,
    headers: headersObj,
    nextUrl: urlObj,
    cookies: {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      getAll: jest.fn(),
      toString: jest.fn(),
    },
    page: undefined,
    ua: undefined,
  } as unknown as import("next/server").NextRequest
}

describe("rate limiting", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    mockDateNow.mockReturnValue(1000000) // Base time: 1000000ms
  })

  afterEach(() => {
    // Clear all timers
    jest.clearAllTimers()
  })

  afterAll(() => {
    // Restore real timers
    jest.useRealTimers()
    mockDateNow.mockRestore()
  })

  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const request = createMockRequest("http://localhost:3000/api/test")
      const result = checkRateLimit(request, RATE_LIMITS.API, "test-user-id")

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThan(0)
    })

    it("should block requests exceeding limit", () => {
      const request = createMockRequest("http://localhost:3000/api/test")
      const config = {
        windowMs: 1000,
        maxRequests: 2,
      }

      // Make requests up to the limit
      checkRateLimit(request, config, "test-user-id")
      checkRateLimit(request, config, "test-user-id")

      // This should be blocked
      const result = checkRateLimit(request, config, "test-user-id")
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("should reset after time window", () => {
      const request = createMockRequest("http://localhost:3000/api/test")
      const config = {
        windowMs: 1000,
        maxRequests: 1,
      }

      // Make a request
      const firstResult = checkRateLimit(request, config, "test-user-reset")
      expect(firstResult.allowed).toBe(true)

      // Advance time beyond the window
      mockDateNow.mockReturnValue(1000000 + 2000)

      // Should be allowed again (new window)
      const result = checkRateLimit(request, config, "test-user-reset")
      expect(result.allowed).toBe(true)
    })

    it("should track different users separately", () => {
      const request = createMockRequest("http://localhost:3000/api/test")
      const config = {
        windowMs: 1000,
        maxRequests: 1,
      }

      // User 1 makes a request
      const result1 = checkRateLimit(request, config, "user-1")
      expect(result1.allowed).toBe(true)

      // User 2 should still be allowed
      const result2 = checkRateLimit(request, config, "user-2")
      expect(result2.allowed).toBe(true)
    })

    it("should track by IP when no user ID provided", () => {
      const request = createMockRequest("http://localhost:3000/api/test", {
        "x-forwarded-for": "192.168.1.1",
      })
      const config = {
        windowMs: 1000,
        maxRequests: 1,
      }

      // First request should be allowed
      const result1 = checkRateLimit(request, config)
      expect(result1.allowed).toBe(true)

      // Second request from same IP should be blocked
      const result2 = checkRateLimit(request, config)
      expect(result2.allowed).toBe(false)
    })

    it("should return correct remaining count", () => {
      const request = createMockRequest("http://localhost:3000/api/test")
      const config = {
        windowMs: 1000,
        maxRequests: 5,
      }

      // Make 2 requests
      checkRateLimit(request, config, "test-user")
      const result = checkRateLimit(request, config, "test-user")

      expect(result.remaining).toBe(3) // 5 - 2 = 3
    })

    it("should return correct reset time", () => {
      const request = createMockRequest("http://localhost:3000/api/test")
      const config = {
        windowMs: 5000,
        maxRequests: 5,
      }

      const result = checkRateLimit(request, config, "test-user-reset-time")
      // Reset time should be current time + window
      const expectedResetTime = Date.now() + 5000

      expect(result.resetTime).toBeGreaterThanOrEqual(expectedResetTime - 10) // Allow 10ms variance
      expect(result.resetTime).toBeLessThanOrEqual(expectedResetTime + 10)
    })
  })

  describe("rateLimitCheck", () => {
    it("should return null when request is allowed", () => {
      const request = createMockRequest("http://localhost:3000/api/test")
      const result = rateLimitCheck(request, RATE_LIMITS.API, "test-user-id")

      expect(result).toBeNull()
    })

    it("should return NextResponse with error when rate limited", () => {
      const request = createMockRequest("http://localhost:3000/api/test")
      const config = {
        windowMs: 1000,
        maxRequests: 1,
        message: "Rate limit exceeded",
      }

      // Make first request
      rateLimitCheck(request, config, "test-user-id")

      // Second request should be rate limited
      const result = rateLimitCheck(request, config, "test-user-id")

      expect(result).not.toBeNull()
      expect(result?.status).toBe(429)
    })

    it("should include rate limit headers in response", async () => {
      const request = createMockRequest("http://localhost:3000/api/test")
      const config = {
        windowMs: 1000,
        maxRequests: 5,
      }

      // Make a request
      rateLimitCheck(request, config, "test-user-id")

      // Make another request to get headers
      const checkResult = checkRateLimit(request, config, "test-user-id")
      const rateLimitResponse = rateLimitCheck(request, config, "test-user-id")

      if (rateLimitResponse) {
        const headers = rateLimitResponse.headers
        expect(headers.get("X-RateLimit-Limit")).toBe("5")
        expect(headers.get("X-RateLimit-Remaining")).toBe(String(checkResult.remaining))
      }
    })
  })

  describe("RATE_LIMITS configuration", () => {
    it("should have AUTH limit configured", () => {
      expect(RATE_LIMITS.AUTH.windowMs).toBe(15 * 60 * 1000)
      expect(RATE_LIMITS.AUTH.maxRequests).toBe(5)
      expect(RATE_LIMITS.AUTH.message).toBeDefined()
    })

    it("should have FORGOT_PASSWORD limit configured", () => {
      expect(RATE_LIMITS.FORGOT_PASSWORD.windowMs).toBe(60 * 60 * 1000)
      expect(RATE_LIMITS.FORGOT_PASSWORD.maxRequests).toBe(10)
      expect(RATE_LIMITS.FORGOT_PASSWORD.message).toBeDefined()
    })

    it("should have API limit configured", () => {
      expect(RATE_LIMITS.API.windowMs).toBeDefined()
      expect(RATE_LIMITS.API.maxRequests).toBeDefined()
    })
  })
})

