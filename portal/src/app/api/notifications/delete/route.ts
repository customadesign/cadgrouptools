import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { notificationService } from '@/services/notificationService';
import { requireAuth } from '@/lib/auth';

// DELETE /api/notifications/delete - Delete notification(s)
export const DELETE = requireAuth(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const notificationId = searchParams.get('id');
    const notificationIds = searchParams.get('ids')?.split(',');

    let result;

    if (notificationIds && notificationIds.length > 0) {
      // Delete multiple notifications
      const deletedCount = await notificationService.deleteMultipleNotifications(
        notificationIds,
        session.user.id
      );
      result = {
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} notifications`,
      };
    } else if (notificationId) {
      // Delete single notification
      const success = await notificationService.deleteNotification(notificationId, session.user.id);
      result = {
        success,
        message: success ? 'Notification deleted' : 'Notification not found',
      };
    } else {
      return NextResponse.json(
        { error: 'Must provide notification id or ids' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
});