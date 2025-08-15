import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { activityLogger } from '@/services/activityLogger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { pathname, searchParams, timestamp } = body;

    // Log page view activity
    await activityLogger.logActivity(
      request,
      {
        actionType: 'view',
        resourceType: 'system',
        resourceName: pathname,
        metadata: {
          type: 'page_view',
          pathname,
          searchParams,
          referrer: request.headers.get('referer') || 'direct',
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
    console.error('Error tracking page view:', error);
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}