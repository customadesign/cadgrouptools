import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Notification } from '@/types/notification';

// Mock notifications database - in production, use a real database
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'proposal',
    title: 'Proposal Accepted',
    message: 'Your proposal for "Web Development Project" has been accepted by Tech Solutions Inc.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    priority: 'high',
    actionUrl: '/proposals/123',
    sender: {
      name: 'John Smith',
      role: 'Client',
    },
  },
  {
    id: '2',
    type: 'user',
    title: 'New Team Member',
    message: 'Sarah Johnson has joined your team as a Senior Developer',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    actionUrl: '/team/sarah-johnson',
    sender: {
      name: 'HR Department',
    },
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Received',
    message: 'Payment of $15,000 received from Client ABC for Invoice #INV-2024-045',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
    priority: 'medium',
    actionUrl: '/accounting/transactions',
    metadata: {
      amount: 15000,
    },
  },
];

// GET /api/notifications - Fetch all notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In production, fetch notifications from database filtered by user
    // const notifications = await NotificationModel.find({ userId: session.user.id });
    
    return NextResponse.json({
      notifications: mockNotifications,
      total: mockNotifications.length,
      unread: mockNotifications.filter(n => !n.read).length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate notification data
    if (!body.type || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newNotification: Notification = {
      id: Date.now().toString(),
      type: body.type,
      title: body.title,
      message: body.message,
      timestamp: new Date(),
      read: false,
      priority: body.priority,
      actionUrl: body.actionUrl,
      metadata: body.metadata,
      sender: body.sender,
    };

    // In production, save to database
    // const notification = await NotificationModel.create(newNotification);
    
    // Send real-time notification via WebSocket
    // sendWebSocketNotification(session.user.id, newNotification);
    
    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}