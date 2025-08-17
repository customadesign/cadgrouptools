import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { emitToUser, emitActivity, emitNotification, isWebSocketAvailable } from '@/lib/websocket';

/**
 * Example API route for emitting WebSocket events
 * This demonstrates how to send real-time notifications from API routes
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, targetUserId, data } = body;

    // Check if WebSocket server is available
    if (!isWebSocketAvailable()) {
      return NextResponse.json(
        { 
          error: 'WebSocket server not available',
          message: 'Real-time features are currently unavailable'
        },
        { status: 503 }
      );
    }

    switch (type) {
      case 'notification':
        // Send a notification to a specific user
        if (targetUserId && data) {
          emitNotification(targetUserId, {
            ...data,
            timestamp: new Date().toISOString(),
            from: session.user.id
          });
          
          return NextResponse.json({
            success: true,
            message: 'Notification sent',
            targetUserId
          });
        }
        break;

      case 'activity':
        // Broadcast an activity update
        if (data) {
          const activity = {
            ...data,
            userId: session.user.id,
            timestamp: new Date().toISOString()
          };
          
          emitActivity(activity, {
            userId: data.userId,
            resourceType: data.resourceType,
            actionType: data.actionType
          });
          
          return NextResponse.json({
            success: true,
            message: 'Activity broadcast sent'
          });
        }
        break;

      case 'custom':
        // Send a custom event to a specific user
        if (targetUserId && data?.event && data?.payload) {
          emitToUser(targetUserId, data.event, data.payload);
          
          return NextResponse.json({
            success: true,
            message: 'Custom event sent',
            event: data.event
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );

  } catch (error) {
    console.error('WebSocket emit error:', error);
    return NextResponse.json(
      { error: 'Failed to emit WebSocket event' },
      { status: 500 }
    );
  }
}