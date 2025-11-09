import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isPublicRoute, isPrivateRoute } from "./lib/routes"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("sb-access-token")?.value
  const isAuthenticated = !!accessToken

  // Check if route is private
  if (isPrivateRoute(pathname)) {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Check if route is public
  if (isPublicRoute(pathname)) {
    // Redirect authenticated users away from auth pages
    if (
      isAuthenticated &&
      (pathname.startsWith("/auth/login") ||
        pathname.startsWith("/auth/signup"))
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
