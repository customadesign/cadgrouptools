import { NextRequest, NextResponse } from 'next/server';
import { verifyStatelessAuth } from '@/lib/auth-stateless';
import { getToken } from 'next-auth/jwt';

/**
 * Test endpoint to verify stateless JWT authentication.
 * Returns decoded JWT token information without any database lookups.
 */
export async function GET(request: NextRequest) {
  try {
    // Method 1: Using our stateless auth helper
    const user = await verifyStatelessAuth(request);
    
    // Method 2: Direct token verification (for comparison)
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
    });

    return NextResponse.json({
      authenticated: !!user,
      statelessAuth: user,
      rawToken: token,
      info: {
        method: 'Stateless JWT Cookie',
        requiresDatabase: false,
        tokenLocation: 'HTTP-only cookie (next-auth.session-token)',
        verification: 'Cryptographic signature verification',
        expiry: user ? new Date((user.exp || 0) * 1000).toISOString() : null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: 'Failed to verify authentication',
      info: {
        method: 'Stateless JWT Cookie',
        requiresDatabase: false,
      },
    }, { status: 401 });
  }
}