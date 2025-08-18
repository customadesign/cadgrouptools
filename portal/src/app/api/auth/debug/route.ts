import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Step 1: Check environment variables
    const envCheck = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    };
    
    // Step 2: Test database connection
    let dbConnected = false;
    let dbError = null;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (error: any) {
      dbError = error.message;
    }
    
    // Step 3: Find user
    let userFound = false;
    let userDetails = null;
    let passwordValid = false;
    
    if (dbConnected && email) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        userFound = true;
        userDetails = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          hasPassword: !!user.password,
        };
        
        // Step 4: Test password
        if (password && user.password) {
          passwordValid = await bcrypt.compare(password, user.password);
        }
      }
    }
    
    // Return debug information
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        connected: dbConnected,
        error: dbError,
      },
      authentication: {
        userFound,
        userDetails,
        passwordValid,
        testCredentials: {
          emailProvided: !!email,
          passwordProvided: !!password,
        },
      },
      debug: {
        message: 'This endpoint helps debug authentication issues',
        nextSteps: !userFound 
          ? 'User not found - check email or create user'
          : !passwordValid 
            ? 'Invalid password - reset password'
            : 'Credentials valid - check NextAuth configuration',
      },
    }, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

// GET endpoint for session and authentication check
export async function GET(request: NextRequest) {
  try {
    // Get session using getServerSession
    const session = await getServerSession(authOptions);
    
    // Get JWT token directly
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Get cookies
    const cookies = request.cookies.getAll();
    const sessionCookie = cookies.find(c => 
      c.name.includes('session-token') || 
      c.name.includes('next-auth')
    );
    
    return NextResponse.json({
      status: 'Auth debug endpoint active',
      timestamp: new Date().toISOString(),
      authentication: {
        hasSession: !!session,
        hasToken: !!token,
        hasSessionCookie: !!sessionCookie,
        isAuthenticated: !!(session?.user || token),
      },
      session: session ? {
        user: session.user,
        expires: session.expires,
      } : null,
      token: token ? {
        email: token.email,
        role: token.role,
        exp: token.exp ? new Date((token.exp as number) * 1000).toISOString() : null,
        isExpired: token.exp ? Date.now() / 1000 > (token.exp as number) : false,
      } : null,
      cookies: {
        count: cookies.length,
        names: cookies.map(c => c.name),
      },
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
        NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
        MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
        NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error.message,
    }, { status: 500 });
  }
}