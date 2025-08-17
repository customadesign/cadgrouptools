import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { notificationService } from '@/services/notificationService';
import { requireAuth } from '@/lib/auth';

// GET /api/notifications/unread-count - Get unread notification count
export const GET = requireAuth(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await notificationService.getUnreadCount(session.user.id);

    return NextResponse.json({
      count,
      userId: session.user.id,
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return NextResponse.json(
      { error: 'Failed to get unread count' },
      { status: 500 }
    );
  }
});