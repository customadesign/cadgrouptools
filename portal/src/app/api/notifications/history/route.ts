import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import pushNotificationService from '@/services/pushNotificationService';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Admins can see all notifications, users only see their own
    const userId = user.role === 'admin' ? undefined : user.id;

    const history = await pushNotificationService.getNotificationHistory(limit, userId);

    return NextResponse.json({
      history
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification history' },
      { status: 500 }
    );
  }
}