import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import pushNotificationService from '@/services/pushNotificationService';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get notification data from request body
    const body = await request.json();
    const { 
      targetUsers, // 'all', 'admins', or array of user IDs
      title, 
      body: notificationBody, 
      requireInteraction,
      actions,
      data 
    } = body;

    if (!title || !notificationBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Send notification
    const result = await pushNotificationService.sendCustomNotification(
      targetUsers,
      title,
      notificationBody,
      {
        requireInteraction,
        actions,
        data
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      ...result
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}