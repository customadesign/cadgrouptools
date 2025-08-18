import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// DELETE /api/notifications/clear - Clear all notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In production, delete all notifications for user from database
    // await NotificationModel.deleteMany({ userId: session.user.id });
    
    return NextResponse.json(
      { message: 'All notifications cleared' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}