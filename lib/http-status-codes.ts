/**
 * HTTP Status Codes Constants
 * Provides common HTTP status codes with labels for the application
 */

export interface HttpStatusCodeOption {
  value: number
  label: string
}

/**
 * Common HTTP status codes used in mock API creation
 */
export const HTTP_STATUS_CODES: readonly HttpStatusCodeOption[] = [
  { value: 200, label: "200 - OK" },
  { value: 201, label: "201 - Created" },
  { value: 400, label: "400 - Bad Request" },
  { value: 401, label: "401 - Unauthorized" },
  { value: 404, label: "404 - Not Found" },
  { value: 500, label: "500 - Internal Server Error" },
] as const

