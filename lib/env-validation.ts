/**
 * Environment variable validation
 * Validates required environment variables at startup
 */

const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const

const optionalEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
} as const

/**
 * Validate required environment variables
 * Throws error if any required variable is missing
 * Only validates in production to avoid blocking development
 */
export const validateEnv = (): void => {
  // Skip validation in development to allow flexible setup
  if (process.env.NODE_ENV === "development") {
    return
  }

  const missing: string[] = []

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value.trim() === "") {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Please check your .env.local file or Vercel environment variables.\n" +
        "See docs/ENV_SETUP.md for setup instructions."
    )
  }
}

/**
 * Get environment variable with validation
 */
export const getEnvVar = (key: keyof typeof requiredEnvVars | keyof typeof optionalEnvVars): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value
}

/**
 * Check if we're in production
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production"
}

/**
 * Get app URL (with fallback)
 */
export const getAppUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000"
  )
}

