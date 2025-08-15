import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import PushSubscription from '@/models/PushSubscription';
import NotificationHistory from '@/models/NotificationHistory';

export async function GET(request: NextRequest) {
  try {
    // Check MongoDB connection
    await connectToDatabase();
    
    // Check VAPID keys are configured
    const vapidConfigured = !!(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && 
      process.env.VAPID_PRIVATE_KEY
    );
    
    if (!vapidConfigured) {
      throw new Error('VAPID keys not configured');
    }
    
    // Get subscription statistics
    const [
      activeSubscriptions,
      totalSubscriptions,
      recentNotifications,
      failedNotifications
    ] = await Promise.all([
      PushSubscription.countDocuments({ isActive: true }),
      PushSubscription.countDocuments({}),
      NotificationHistory.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      NotificationHistory.countDocuments({
        failureCount: { $gt: 0 },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);
    
    // Calculate success rate
    const successRate = recentNotifications > 0 
      ? ((recentNotifications - failedNotifications) / recentNotifications * 100).toFixed(2)
      : 100;
    
    // Get last notification time
    const lastNotification = await NotificationHistory.findOne()
      .sort({ createdAt: -1 })
      .select('createdAt');
    
    return NextResponse.json({
      status: 'healthy',
      service: 'push-notifications',
      timestamp: new Date().toISOString(),
      metrics: {
        activeSubscriptions,
        totalSubscriptions,
        inactiveSubscriptions: totalSubscriptions - activeSubscriptions,
        recentNotifications24h: recentNotifications,
        failedNotifications24h: failedNotifications,
        successRate: parseFloat(successRate),
        lastNotificationSent: lastNotification?.createdAt || null
      },
      config: {
        vapidConfigured,
        vapidSubject: process.env.VAPID_SUBJECT || 'not configured',
        mongodbConnected: true
      },
      checks: {
        database: 'pass',
        vapidKeys: vapidConfigured ? 'pass' : 'fail',
        serviceWorker: 'requires client check'
      }
    });
  } catch (error: any) {
    console.error('Push notification health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      service: 'push-notifications',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        database: error.message.includes('MongoDB') ? 'fail' : 'unknown',
        vapidKeys: error.message.includes('VAPID') ? 'fail' : 'unknown',
        serviceWorker: 'unknown'
      }
    }, { status: 503 });
  }
}