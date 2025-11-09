// Global error handler for API routes

import { NextRequest, NextResponse } from "next/server"
import {
  AppError,
  handlePrismaError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} from "./errors"
import { logError } from "./error-logger"

export interface ErrorResponse {
  error: string
  code?: string
  details?: any
  stack?: string
}

/**
 * Global error handler for API routes
 * Converts errors to appropriate HTTP responses
 */
export function handleApiError(
  error: unknown,
  request?: NextRequest
): NextResponse<ErrorResponse> {
  // Log the error
  logError(error, {
    url: request?.url,
    method: request?.method,
  })

  // Handle known AppError types
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
    }

    // Include details in development mode
    if (process.env.NODE_ENV === "development") {
      response.details = error.details
      response.stack = error.stack
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // Handle Prisma errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = handlePrismaError(error)
    const response: ErrorResponse = {
      error: prismaError.message,
      code: prismaError.code,
    }

    if (process.env.NODE_ENV === "development") {
      response.details = prismaError.details
      response.stack = prismaError.stack
    }

    return NextResponse.json(response, { status: prismaError.statusCode })
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes("Unauthorized") || error.message.includes("Invalid user")) {
      const authError = new AuthenticationError(error.message)
      return NextResponse.json(
        {
          error: authError.message,
          code: authError.code,
          ...(process.env.NODE_ENV === "development" && {
            details: error.message,
            stack: error.stack,
          }),
        },
        { status: 401 }
      )
    }

    if (error.message.includes("Not found")) {
      const notFoundError = new NotFoundError(error.message)
      return NextResponse.json(
        {
          error: notFoundError.message,
          code: notFoundError.code,
          ...(process.env.NODE_ENV === "development" && {
            details: error.message,
            stack: error.stack,
          }),
        },
        { status: 404 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
          stack: error.stack,
        }),
      },
      { status: 500 }
    )
  }

  // Handle unknown error types
  return NextResponse.json(
    {
      error: "Internal server error",
      code: "UNKNOWN_ERROR",
      ...(process.env.NODE_ENV === "development" && {
        details: String(error),
      }),
    },
    { status: 500 }
  )
}

/**
 * Wrapper for API route handlers to automatically handle errors
 */
export function withErrorHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      return handleApiError(error, request)
    }
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequired(
  body: any,
  fields: string[]
): ValidationError | null {
  const missing: string[] = []

  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      missing.push(field)
    }
  }

  if (missing.length > 0) {
    return new ValidationError(
      `Missing required fields: ${missing.join(", ")}`,
      { missing }
    )
  }

  return null
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return new ValidationError("Invalid email format", { email })
  }
  return null
}

