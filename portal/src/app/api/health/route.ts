import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: 'operational',
      database: 'checking',
      storage: 'operational',
      email: 'operational',
    },
    version: process.env.npm_package_version || '0.1.0',
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.services.database = 'operational';
    } else {
      await connectToDatabase();
      healthCheck.services.database = 'operational';
    }

    // Check if required environment variables are set
    const requiredEnvVars = [
      'MONGODB_URI',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingEnvVars.length > 0) {
      healthCheck.status = 'degraded';
      healthCheck.warnings = `Missing environment variables: ${missingEnvVars.join(', ')}`;
    }

    // Check Supabase connection
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
      healthCheck.services.storage = 'degraded';
    }

    // Check email service
    if (!process.env.SENDGRID_API_KEY) {
      healthCheck.services.email = 'degraded';
    }

    // Determine overall health status
    const serviceStatuses = Object.values(healthCheck.services);
    if (serviceStatuses.includes('offline')) {
      healthCheck.status = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      healthCheck.status = 'degraded';
    }

    return NextResponse.json(healthCheck, {
      status: healthCheck.status === 'unhealthy' ? 503 : 200,
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    healthCheck.status = 'unhealthy';
    healthCheck.services.database = 'offline';
    healthCheck.error = error.message;

    return NextResponse.json(healthCheck, { status: 503 });
  }
}
