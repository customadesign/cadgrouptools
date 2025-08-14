import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

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

// GET endpoint for basic health check
export async function GET() {
  return NextResponse.json({
    status: 'Auth debug endpoint active',
    timestamp: new Date().toISOString(),
    environment: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
      MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    },
  });
}