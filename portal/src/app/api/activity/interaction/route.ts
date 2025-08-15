import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { activityLogger } from '@/services/activityLogger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { action, resourceType, metadata, timestamp } = body;

    // Log user interaction
    await activityLogger.logActivity(
      request,
      {
        actionType: action as any,
        resourceType: resourceType as any,
        metadata: {
          type: 'user_interaction',
          ...metadata,
          timestamp
        }
      },
      {
        success: true,
        statusCode: 200,
        responseTime: 0
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking user interaction:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}