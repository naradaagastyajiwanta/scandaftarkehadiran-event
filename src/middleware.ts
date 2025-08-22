import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/', '/api/participant'];

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/logout', '/api/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  if (isProtectedRoute) {
    const token = request.cookies.get('token')?.value;

    console.log('Middleware check - path:', pathname, 'token:', !!token);

    if (!token) {
      // Redirect to login if no token
      console.log('No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // For now, just check if token exists (we'll verify in API routes)
    // This avoids JWT import issues in middleware
    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}