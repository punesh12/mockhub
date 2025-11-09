// Error logging utility

interface ErrorContext {
  url?: string
  method?: string
  userId?: string
  [key: string]: any
}

interface ErrorLog {
  timestamp: string
  message: string
  stack?: string
  code?: string
  context?: ErrorContext
  errorType: string
}

/**
 * Log error to console and optionally to external service
 */
export function logError(error: unknown, context?: ErrorContext): void {
  const timestamp = new Date().toISOString()
  let errorLog: ErrorLog

  if (error instanceof Error) {
    errorLog = {
      timestamp,
      message: error.message,
      stack: error.stack,
      errorType: error.constructor.name,
      context,
    }

    // Check if it's a custom AppError
    if ("code" in error && "statusCode" in error) {
      errorLog.code = (error as any).code
    }
  } else {
    errorLog = {
      timestamp,
      message: String(error),
      errorType: typeof error,
      context,
    }
  }

  // Log to console
  console.error("[ERROR]", {
    ...errorLog,
    // Format stack trace for better readability
    ...(errorLog.stack && {
      stack: errorLog.stack.split("\n").slice(0, 5).join("\n"), // First 5 lines
    }),
  })

  // In production, you could send to an error tracking service like Sentry
  if (process.env.NODE_ENV === "production") {
    // Example: Send to Sentry
    // if (typeof window !== "undefined" && window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { custom: context } })
    // }
  }
}

/**
 * Log warning
 */
export function logWarning(message: string, context?: ErrorContext): void {
  const timestamp = new Date().toISOString()
  console.warn("[WARNING]", {
    timestamp,
    message,
    context,
  })
}

/**
 * Log info
 */
export function logInfo(message: string, context?: ErrorContext): void {
  const timestamp = new Date().toISOString()
  console.info("[INFO]", {
    timestamp,
    message,
    context,
  })
}

