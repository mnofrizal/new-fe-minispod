import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // If user is authenticated and tries to access login page, redirect to dashboard
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // If user is not authenticated and tries to access protected routes, redirect to login
    if (!token && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Allow the request to continue
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to login page and API routes
        if (pathname === '/login' || pathname.startsWith('/api/')) {
          return true
        }

        // Allow access to root page
        if (pathname === '/') {
          return true
        }

        // For dashboard routes, require authentication
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }

        // Allow all other routes
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}