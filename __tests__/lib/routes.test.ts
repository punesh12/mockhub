/**
 * Tests for routes utility
 */

import {
  isPublicRoute,
  isPrivateRoute,
  getRouteConfig,
  getPublicRoutes,
  getPrivateRoutes,
  routes,
} from "@/lib/routes"

describe("isPublicRoute", () => {
  it("should return true for public routes", () => {
    expect(isPublicRoute("/")).toBe(true)
    expect(isPublicRoute("/auth/login")).toBe(true)
    expect(isPublicRoute("/auth/signup")).toBe(true)
  })

  it("should return false for private routes", () => {
    expect(isPublicRoute("/dashboard")).toBe(false)
    expect(isPublicRoute("/dashboard/mocks")).toBe(false)
  })

  it("should return false for unknown routes", () => {
    expect(isPublicRoute("/unknown")).toBe(false)
    expect(isPublicRoute("/random/path")).toBe(false)
  })
})

describe("isPrivateRoute", () => {
  it("should return true for private routes", () => {
    expect(isPrivateRoute("/dashboard")).toBe(true)
    expect(isPrivateRoute("/dashboard/mocks")).toBe(true)
    expect(isPrivateRoute("/dashboard/history")).toBe(true)
    expect(isPrivateRoute("/dashboard/test")).toBe(true)
    expect(isPrivateRoute("/dashboard/profile")).toBe(true)
  })

  it("should return false for public routes", () => {
    expect(isPrivateRoute("/")).toBe(false)
    expect(isPrivateRoute("/auth/login")).toBe(false)
  })

  it("should return false for unknown routes", () => {
    expect(isPrivateRoute("/unknown")).toBe(false)
  })
})

describe("getRouteConfig", () => {
  it("should return config for exact match", () => {
    const config = getRouteConfig("/dashboard")

    expect(config).toBeDefined()
    expect(config?.path).toBe("/dashboard")
    expect(config?.access).toBe("private")
  })

  it("should return config for nested routes", () => {
    const config = getRouteConfig("/dashboard/mocks/new")

    expect(config).toBeDefined()
    expect(config?.path).toBe("/dashboard")
    expect(config?.access).toBe("private")
  })

  it("should return undefined for unknown routes", () => {
    const config = getRouteConfig("/unknown/route")

    expect(config).toBeUndefined()
  })

  it("should prioritize exact match over prefix match", () => {
    // If there's an exact match, it should return that
    const config = getRouteConfig("/dashboard")

    expect(config?.path).toBe("/dashboard")
  })
})

describe("getPublicRoutes", () => {
  it("should return only public routes", () => {
    const publicRoutes = getPublicRoutes()

    expect(publicRoutes.length).toBeGreaterThan(0)
    publicRoutes.forEach((route) => {
      expect(route.access).toBe("public")
    })
  })

  it("should include landing page", () => {
    const publicRoutes = getPublicRoutes()
    const landingPage = publicRoutes.find((r) => r.path === "/")

    expect(landingPage).toBeDefined()
  })

  it("should include auth routes", () => {
    const publicRoutes = getPublicRoutes()
    const loginRoute = publicRoutes.find((r) => r.path === "/auth/login")
    const signupRoute = publicRoutes.find((r) => r.path === "/auth/signup")

    expect(loginRoute).toBeDefined()
    expect(signupRoute).toBeDefined()
  })
})

describe("getPrivateRoutes", () => {
  it("should return only private routes", () => {
    const privateRoutes = getPrivateRoutes()

    expect(privateRoutes.length).toBeGreaterThan(0)
    privateRoutes.forEach((route) => {
      expect(route.access).toBe("private")
    })
  })

  it("should include dashboard routes", () => {
    const privateRoutes = getPrivateRoutes()
    const dashboardRoute = privateRoutes.find((r) => r.path === "/dashboard")

    expect(dashboardRoute).toBeDefined()
  })
})

describe("routes array", () => {
  it("should contain route configurations", () => {
    expect(routes.length).toBeGreaterThan(0)
  })

  it("should have valid route structure", () => {
    routes.forEach((route) => {
      expect(route).toHaveProperty("path")
      expect(route).toHaveProperty("access")
      expect(typeof route.path).toBe("string")
      expect(["public", "private"]).toContain(route.access)
    })
  })
})

