/**
 * Route configuration for public and private pages
 * Add new routes here and mark them as public or private
 */

export type RouteAccess = "public" | "private"

export interface RouteConfig {
  path: string
  access: RouteAccess
  description?: string
}

/**
 * List of all routes and their access levels
 */
export const routes: RouteConfig[] = [
  // Public routes
  {
    path: "/",
    access: "public",
    description: "Landing page",
  },
  {
    path: "/auth/login",
    access: "public",
    description: "Login page",
  },
  {
    path: "/auth/signup",
    access: "public",
    description: "Signup page",
  },

  // Private routes (require authentication)
  {
    path: "/dashboard",
    access: "private",
    description: "Main dashboard",
  },
  {
    path: "/dashboard/mocks",
    access: "private",
    description: "Mock APIs list",
  },
  {
    path: "/dashboard/history",
    access: "private",
    description: "Request history",
  },
  {
    path: "/dashboard/test",
    access: "private",
    description: "API testing playground",
  },
  {
    path: "/dashboard/profile",
    access: "private",
    description: "User profile",
  },
]

/**
 * Check if a path is a public route
 */
export function isPublicRoute(pathname: string): boolean {
  return routes.some(
    (route) => route.access === "public" && matchesRoute(pathname, route.path)
  )
}

/**
 * Check if a path is a private route
 */
export function isPrivateRoute(pathname: string): boolean {
  return routes.some(
    (route) => route.access === "private" && matchesRoute(pathname, route.path)
  )
}

/**
 * Check if a pathname matches a route pattern
 * Supports exact matches and prefix matches for nested routes
 */
function matchesRoute(pathname: string, routePath: string): boolean {
  // Exact match
  if (pathname === routePath) {
    return true
  }

  // Prefix match for nested routes (e.g., /dashboard/mocks matches /dashboard)
  if (pathname.startsWith(routePath + "/")) {
    return true
  }

  return false
}

/**
 * Get route configuration for a pathname
 */
export function getRouteConfig(pathname: string): RouteConfig | undefined {
  // Find exact match first
  const exactMatch = routes.find((route) => route.path === pathname)
  if (exactMatch) {
    return exactMatch
  }

  // Find prefix match (for nested routes)
  return routes.find((route) => pathname.startsWith(route.path + "/"))
}

/**
 * Get all public routes
 */
export function getPublicRoutes(): RouteConfig[] {
  return routes.filter((route) => route.access === "public")
}

/**
 * Get all private routes
 */
export function getPrivateRoutes(): RouteConfig[] {
  return routes.filter((route) => route.access === "private")
}
