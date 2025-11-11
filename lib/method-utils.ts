/**
 * Get color classes for HTTP method badges
 * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE, etc.)
 * @returns Tailwind CSS classes for the method badge
 */
export const getMethodColor = (method: string): string => {
  const colors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    POST: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    PUT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    HEAD: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    OPTIONS: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  }
  return colors[method.toUpperCase()] || "bg-muted text-muted-foreground"
}

