import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

export async function verifyAuth(request?: NextRequest): Promise<AuthUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role as 'admin' | 'staff',
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export function requireAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const user = await verifyAuth();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Add user to request for handler to use
    (request as any).user = user;
    return handler(request, ...args);
  };
}

export function requireRole(role: 'admin' | 'staff') {
  return (handler: Function) => {
    return async (request: NextRequest, ...args: any[]) => {
      const user = await verifyAuth();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (role === 'admin' && user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Add user to request for handler to use
      (request as any).user = user;
      return handler(request, ...args);
    };
  };
}