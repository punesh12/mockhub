import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Supabase connection pooling configuration
// Use connection pooling URL for serverless environments (Vercel, etc.)
// Direct connection URL is used for migrations and local development
// For local development, prefer DATABASE_URL (direct connection, port 5432)
// For production/serverless, use NEXT_PUBLIC_SUPABASE_CONNECTION_STRING (pooling, port 6543)
const databaseUrl =
  process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_CONNECTION_STRING

if (!databaseUrl) {
  throw new Error(
    "Database connection string is not set. " +
      "Please add DATABASE_URL (for local dev) or NEXT_PUBLIC_SUPABASE_CONNECTION_STRING to your .env.local file. " +
      "For Supabase, get the connection string from Settings → Database. " +
      'Use "Direct connection" (port 5432) for local development. ' +
      "See SUPABASE_SETUP.md for instructions."
  )
}

// Configure Prisma with connection pooling for Supabase
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
