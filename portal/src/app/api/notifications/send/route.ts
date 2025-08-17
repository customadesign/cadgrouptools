import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import pushNotificationService from '@/services/pushNotificationService';
import { emitNotification, isWebSocketAvailable } from '@/lib/websocket';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get notification data from request body
    const body = await request.json();
    const {
      targetUsers,
      title,
      body: notificationBody,
      requireInteraction,
      actions,
      data,
    } = body;

    // Validate required fields
    if (!targetUsers || !title || !notificationBody) {
      return NextResponse.json(
        { error: 'Missing required fields: targetUsers, title, body' },
        { status: 400 }
      );
    }

    // Send notification via push service
    const result = await pushNotificationService.sendCustomNotification(
      targetUsers,
      title,
      notificationBody,
      {
        requireInteraction,
        actions,
        data,
      },
      session.user.id
    );

    // Also emit via WebSocket for real-time delivery if available
    if (isWebSocketAvailable()) {
      targetUsers.forEach((userId: string) => {
        emitNotification(userId, {
          title,
          body: notificationBody,
          data,
          timestamp: new Date().toISOString(),
          from: session.user.id,
        });
      });
    }

    return NextResponse.json({
      success: true,
      ...result,
      websocketDelivered: isWebSocketAvailable(),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}