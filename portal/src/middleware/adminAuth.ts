import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

/**
 * Middleware to protect admin routes
 * Returns early with 403 if user is not an admin
 */
export async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  if (session.user?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Administrator access required' },
      { status: 403 }
    );
  }
  
  return null; // Continue with the request
}

/**
 * Higher-order function to wrap API routes with admin authentication
 */
export function withAdminAuth(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    const authError = await requireAdmin(req);
    if (authError) return authError;
    
    return handler(req, context);
  };
}
