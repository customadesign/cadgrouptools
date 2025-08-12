import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Admin-only routes
    const adminOnlyPaths = [
      '/admin',
      '/api/admin',
      '/settings/users',
    ];
    
    const isAdminRoute = adminOnlyPaths.some(path => 
      req.nextUrl.pathname.startsWith(path)
    );
    
    if (isAdminRoute && req.nextauth.token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Configure which routes require authentication
export const config = {
  matcher: [
    // Protected routes - require authentication
    '/dashboard/:path*',
    '/accounting/:path*',
    '/proposals/:path*',
    '/clients/:path*',
    '/settings/:path*',
    '/api/clients/:path*',
    '/api/proposals/:path*',
    '/api/statements/:path*',
    '/api/transactions/:path*',
    '/api/uploads/:path*',
    // Exclude auth routes and public pages
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};