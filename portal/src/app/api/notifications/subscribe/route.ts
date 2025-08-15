import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import pushNotificationService from '@/services/pushNotificationService';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription from request body
    const body = await request.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Subscribe the user
    const result = await pushNotificationService.subscribe(
      user.id,
      subscription,
      userAgent || request.headers.get('user-agent') || undefined
    );

    // Send a test notification
    await pushNotificationService.sendToUsers(
      [user.id],
      {
        title: 'Push Notifications Enabled',
        body: 'You will now receive notifications from CADGroup Tools Portal',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          type: 'subscription_confirmation',
          timestamp: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to push notifications',
      subscription: {
        endpoint: result.subscription.endpoint,
        isActive: result.isActive
      }
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get endpoint from query params or body
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    // Unsubscribe the user
    const success = await pushNotificationService.unsubscribe(
      user.id,
      endpoint || undefined
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Successfully unsubscribed from push notifications'
      });
    } else {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscriptions
    const subscriptions = await pushNotificationService.getUserSubscriptions(user.id);

    return NextResponse.json({
      subscriptions: subscriptions.map(sub => ({
        endpoint: sub.subscription.endpoint,
        userAgent: sub.userAgent,
        createdAt: sub.createdAt,
        lastUsed: sub.lastUsed,
        isActive: sub.isActive
      }))
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}