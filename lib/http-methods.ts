/**
 * HTTP Methods Enum and Constants
 * Provides type-safe HTTP method definitions for the application
 */

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}

/**
 * Array of all HTTP methods for iteration
 */
export const HTTP_METHODS: readonly string[] = Object.values(HttpMethod)

/**
 * Array of common HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * Used in forms and mock API creation
 */
export const COMMON_HTTP_METHODS: readonly string[] = [
  HttpMethod.GET,
  HttpMethod.POST,
  HttpMethod.PUT,
  HttpMethod.PATCH,
  HttpMethod.DELETE,
]

/**
 * Array of all HTTP methods including HEAD and OPTIONS
 * Used in API testing playground
 */
export const ALL_HTTP_METHODS: readonly string[] = [
  HttpMethod.GET,
  HttpMethod.POST,
  HttpMethod.PUT,
  HttpMethod.PATCH,
  HttpMethod.DELETE,
  HttpMethod.HEAD,
  HttpMethod.OPTIONS,
]

/**
 * Check if a string is a valid HTTP method
 * @param method - The method to validate
 * @returns true if the method is valid
 */
export const isValidHttpMethod = (method: string): method is HttpMethod => {
  return Object.values(HttpMethod).includes(method.toUpperCase() as HttpMethod)
}

/**
 * Check if a method is in the common HTTP methods list (GET, POST, PUT, PATCH, DELETE)
 * @param method - The method to check
 * @returns true if the method is a common HTTP method
 */
export const isCommonHttpMethod = (method: string): boolean => {
  return COMMON_HTTP_METHODS.includes(method.toUpperCase())
}

