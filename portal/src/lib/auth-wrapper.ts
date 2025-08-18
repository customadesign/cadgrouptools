import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

/**
 * Wrapper for API routes that require authentication
 * This wrapper properly handles authentication for Next.js App Router API routes
 */
export function withAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      // Get session using getServerSession
      const session = await getServerSession(authOptions);
      
      // Debug logging
      console.log('[Auth Wrapper] Session check:', {
        path: req.url,
        hasSession: !!session,
        user: session?.user?.email,
        timestamp: new Date().toISOString()
      });
      
      // Check if user is authenticated
      if (!session?.user) {
        console.error('[Auth Wrapper] Authentication failed - no session');
        return NextResponse.json(
          { 
            error: 'Unauthorized',
            message: 'Please sign in to access this resource',
            redirect: '/auth/signin'
          },
          { 
            status: 401,
            headers: {
              'WWW-Authenticate': 'Bearer',
            }
          }
        );
      }
      
      // Attach session to request for handler use
      (req as any).session = session;
      
      // Call the original handler with authenticated session
      return handler(req, context);
    } catch (error) {
      console.error('[Auth Wrapper] Error in authentication:', error);
      return NextResponse.json(
        { 
          error: 'Authentication Error',
          message: 'An error occurred while authenticating your request'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper for API routes that require admin role
 */
export function withAdminAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      // Get session using getServerSession
      const session = await getServerSession(authOptions);
      
      // Check if user is authenticated
      if (!session?.user) {
        return NextResponse.json(
          { 
            error: 'Unauthorized',
            message: 'Please sign in to access this resource'
          },
          { status: 401 }
        );
      }
      
      // Check if user has admin role
      if (session.user.role !== 'admin') {
        console.error('[Auth Wrapper] Admin access denied for:', session.user.email);
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: 'You do not have permission to access this resource'
          },
          { status: 403 }
        );
      }
      
      // Attach session to request for handler use
      (req as any).session = session;
      
      // Call the original handler with authenticated session
      return handler(req, context);
    } catch (error) {
      console.error('[Auth Wrapper] Error in admin authentication:', error);
      return NextResponse.json(
        { 
          error: 'Authentication Error',
          message: 'An error occurred while authenticating your request'
        },
        { status: 500 }
      );
    }
  };
}