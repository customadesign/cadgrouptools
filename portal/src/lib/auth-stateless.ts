import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

/**
 * Stateless authentication verification using JWT tokens.
 * This function verifies the JWT token without any database lookups,
 * making it truly stateless and performant.
 */
export async function verifyStatelessAuth(req: NextRequest) {
  try {
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
    });

    if (!token) {
      return null;
    }

    // Check if token is expired
    if (token.exp && Date.now() / 1000 > (token.exp as number)) {
      return null;
    }

    // Return user info from the JWT token (no database lookup)
    return {
      id: token.id as string,
      email: token.email as string,
      role: token.role as string,
      iat: token.iat as number,
      exp: token.exp as number,
    };
  } catch (error) {
    console.error('Stateless auth verification error:', error);
    return null;
  }
}

/**
 * Middleware wrapper for API routes requiring authentication.
 * Uses stateless JWT verification - no database lookups.
 */
export function withStatelessAuth(
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    const user = await verifyStatelessAuth(req);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Attach user to request for the handler
    (req as any).user = user;
    
    return handler(req, context);
  };
}

/**
 * Middleware wrapper for API routes requiring specific roles.
 * Uses stateless JWT verification - no database lookups.
 */
export function withStatelessRole(role: 'admin' | 'staff') {
  return (handler: (req: NextRequest, context: any) => Promise<Response>) => {
    return async (req: NextRequest, context: any) => {
      const user = await verifyStatelessAuth(req);
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (role === 'admin' && user.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Forbidden - Admin access required' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Attach user to request for the handler
      (req as any).user = user;
      
      return handler(req, context);
    };
  };
}