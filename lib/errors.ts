// Custom error types for the application

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, "DATABASE_ERROR", details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed", details?: any) {
    super(message, 401, "AUTH_ERROR", details)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Unauthorized access", details?: any) {
    super(message, 403, "AUTHORIZATION_ERROR", details)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", details?: any) {
    super(message, 404, "NOT_FOUND", details)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict", details?: any) {
    super(message, 409, "CONFLICT_ERROR", details)
  }
}

// Prisma error codes mapping
export const PRISMA_ERROR_CODES = {
  P1000: "Authentication failed",
  P1001: "Can't reach database server",
  P1002: "Database connection timeout",
  P1003: "Database does not exist",
  P1008: "Operations timed out",
  P1009: "Database already exists",
  P1010: "User was denied access",
  P1011: "TLS connection error",
  P1012: "Error opening a TLS connection",
  P1013: "Invalid database string",
  P1014: "The underlying kind for a model does not exist",
  P1015: "Unsupported features",
  P1016: "Incorrect number of parameters",
  P1017: "Server has closed the connection",
  P2000: "Value too long",
  P2001: "Record does not exist",
  P2002: "Unique constraint failed",
  P2003: "Foreign key constraint failed",
  P2004: "A constraint failed",
  P2005: "Value stored in database is invalid",
  P2006: "Value provided is invalid",
  P2007: "Data validation error",
  P2008: "Query parsing error",
  P2009: "Query validation error",
  P2010: "Raw query failed",
  P2011: "Null constraint violation",
  P2012: "Missing required value",
  P2013: "Missing required argument",
  P2014: "Relation violation",
  P2015: "Related record not found",
  P2016: "Query interpretation error",
  P2017: "Records for relation not connected",
  P2018: "Required connected records not found",
  P2019: "Input error",
  P2020: "Value out of range",
  P2021: "Table does not exist",
  P2022: "Column does not exist",
  P2023: "Inconsistent column data",
  P2024: "Connection pool timeout",
  P2025: "Operation failed",
  P2026: "Unsupported database feature",
  P2027: "Multiple errors occurred",
} as const

export function handlePrismaError(error: any): AppError {
  const errorCode = error.code as keyof typeof PRISMA_ERROR_CODES
  const errorMessage = error.message || "Database error"

  // Handle specific Prisma error codes
  if (errorCode && PRISMA_ERROR_CODES[errorCode]) {
    const message = PRISMA_ERROR_CODES[errorCode]

    // Authentication errors
    if (errorCode === "P1000" || errorCode === "P1010") {
      return new AuthenticationError(message, error)
    }

    // Database connection errors
    if (
      errorCode === "P1001" ||
      errorCode === "P1002" ||
      errorCode === "P1008" ||
      errorCode === "P1017" ||
      errorCode === "P2024"
    ) {
      return new DatabaseError(
        "Database connection failed. Please check your connection.",
        error
      )
    }

    // Not found errors
    if (errorCode === "P2001" || errorCode === "P2015" || errorCode === "P2018") {
      return new NotFoundError(message, error)
    }

    // Conflict errors (unique constraint)
    if (errorCode === "P2002") {
      return new ConflictError("A record with this value already exists", error)
    }

    // Foreign key constraint
    if (errorCode === "P2003" || errorCode === "P2014") {
      return new ValidationError("Invalid reference to related record", error)
    }

    // Table/column errors
    if (errorCode === "P2021" || errorCode === "P2022") {
      return new DatabaseError(
        "Database schema error. Please run migrations.",
        error
      )
    }

    // Validation errors
    if (
      errorCode === "P2000" ||
      errorCode === "P2005" ||
      errorCode === "P2006" ||
      errorCode === "P2007" ||
      errorCode === "P2011" ||
      errorCode === "P2012" ||
      errorCode === "P2013" ||
      errorCode === "P2019" ||
      errorCode === "P2020"
    ) {
      return new ValidationError(message, error)
    }

    // Generic database error
    return new DatabaseError(message, error)
  }

  // Handle string-based error messages
  if (typeof errorMessage === "string") {
    if (errorMessage.includes("P1001") || errorMessage.includes("Can't reach database")) {
      return new DatabaseError(
        "Database connection failed. Please check your connection string.",
        error
      )
    }
    if (errorMessage.includes("P1000") || errorMessage.includes("Authentication failed")) {
      return new AuthenticationError(
        "Database authentication failed. Please check your credentials.",
        error
      )
    }
    if (
      errorMessage.includes("does not exist") ||
      errorMessage.includes("relation") ||
      errorMessage.includes("P2021")
    ) {
      return new DatabaseError(
        "Database tables not found. Please run 'npm run db:push' to create tables.",
        error
      )
    }
    if (errorMessage.includes("Unique constraint")) {
      return new ConflictError("A record with this value already exists", error)
    }
    if (errorMessage.includes("Foreign key constraint")) {
      return new ValidationError("Invalid reference to related record", error)
    }
  }

  // Default to generic database error
  return new DatabaseError("An unexpected database error occurred", error)
}

