import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { notificationService } from '@/services/notificationService';
import { requireAuth } from '@/lib/auth';

// POST /api/notifications/read - Mark notification(s) as read
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, notificationIds, markAll } = body;

    let result;

    if (markAll) {
      // Mark all notifications as read
      const modifiedCount = await notificationService.markAllAsRead(session.user.id);
      result = {
        success: true,
        modifiedCount,
        message: `Marked ${modifiedCount} notifications as read`,
      };
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark multiple notifications as read
      const modifiedCount = await notificationService.markMultipleAsRead(
        notificationIds,
        session.user.id
      );
      result = {
        success: true,
        modifiedCount,
        message: `Marked ${modifiedCount} notifications as read`,
      };
    } else if (notificationId) {
      // Mark single notification as read
      const success = await notificationService.markAsRead(notificationId, session.user.id);
      result = {
        success,
        message: success ? 'Notification marked as read' : 'Notification not found or already read',
      };
    } else {
      return NextResponse.json(
        { error: 'Must provide notificationId, notificationIds, or markAll flag' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
});