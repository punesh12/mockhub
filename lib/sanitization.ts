/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * This is a basic sanitization - for production, consider using DOMPurify
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return ""
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers like onclick=
    .replace(/&#/g, "") // Remove HTML entities
    .replace(/&/g, "&amp;") // Escape ampersands
    .replace(/"/g, "&quot;") // Escape double quotes
    .replace(/'/g, "&#x27;") // Escape single quotes
    .replace(/\//g, "&#x2F;") // Escape forward slashes
}

/**
 * Sanitize an object by recursively sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>]
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = (sanitized[key] as unknown[]).map((item) =>
          typeof item === "string" ? sanitizeString(item) : item
        ) as T[Extract<keyof T, string>]
      } else {
        sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>) as T[Extract<keyof T, string>]
      }
    }
  }

  return sanitized
}

/**
 * Sanitize a URL to prevent protocol-based attacks
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== "string") {
    return ""
  }

  // Remove dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"]
  const lowerUrl = url.toLowerCase().trim()

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return ""
    }
  }

  // Only allow http and https
  if (!lowerUrl.startsWith("http://") && !lowerUrl.startsWith("https://")) {
    return ""
  }

  return url.trim()
}

/**
 * Sanitize SQL-like patterns (basic protection)
 * Note: Prisma already provides SQL injection protection, but this adds an extra layer
 */
export function sanitizeSqlInput(input: string): string {
  if (typeof input !== "string") {
    return ""
  }

  // Remove common SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /(--|#|\/\*|\*\/|;)/g, // SQL comments
    /('|"|`)/g, // SQL quotes
  ]

  let sanitized = input.trim()

  for (const pattern of sqlPatterns) {
    sanitized = sanitized.replace(pattern, "")
  }

  return sanitized
}

/**
 * Sanitize JSON to prevent prototype pollution
 */
export function sanitizeJson(json: unknown): unknown {
  if (typeof json !== "object" || json === null) {
    return json
  }

  if (Array.isArray(json)) {
    return json.map(sanitizeJson)
  }

  const sanitized: Record<string, unknown> = {}

  for (const key in json) {
    // Prevent prototype pollution
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue
    }

    const value = (json as Record<string, unknown>)[key]
    sanitized[key] = sanitizeJson(value)
  }

  return sanitized
}

/**
 * Sanitize endpoint path to prevent path traversal
 */
export function sanitizeEndpoint(endpoint: string): string {
  if (typeof endpoint !== "string") {
    return ""
  }

  // Remove path traversal patterns
  let sanitized = endpoint
    .trim()
    .replace(/\.\./g, "") // Remove ..
    .replace(/\/+/g, "/") // Replace multiple slashes with single
    .replace(/^\/+/, "/") // Ensure starts with single /
    .replace(/\/+$/, "") // Remove trailing slashes

  // Ensure it starts with /
  if (!sanitized.startsWith("/")) {
    sanitized = "/" + sanitized
  }

  return sanitized
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") {
    return ""
  }

  return email.toLowerCase().trim().replace(/[<>]/g, "")
}

/**
 * Sanitize organization slug
 */
export function sanitizeSlug(slug: string): string {
  if (typeof slug !== "string") {
    return ""
  }

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-]/g, "") // Only allow lowercase letters, numbers, and hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}

