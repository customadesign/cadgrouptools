import { NextRequest, NextResponse } from 'next/server';
import { isWebSocketAvailable, getIO } from '@/lib/websocket';

/**
 * WebSocket health check endpoint
 * Returns the status of the WebSocket server and connection information
 */
export async function GET(request: NextRequest) {
  try {
    const isAvailable = isWebSocketAvailable();
    const io = getIO();
    
    if (!isAvailable || !io) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'WebSocket server is not running',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Get connection statistics
    const sockets = await io.fetchSockets();
    const rooms = io.sockets.adapter.rooms;
    
    // Count users in different rooms
    const stats = {
      totalConnections: sockets.length,
      rooms: {
        activities: 0,
        notifications: 0,
        presence: 0,
        users: 0
      }
    };

    // Count room memberships
    rooms.forEach((socketIds, roomName) => {
      if (roomName.startsWith('activities:')) {
        stats.rooms.activities++;
      } else if (roomName.startsWith('notifications:')) {
        stats.rooms.notifications++;
      } else if (roomName === 'presence:updates') {
        stats.rooms.presence = socketIds.size;
      } else if (roomName.startsWith('user:')) {
        stats.rooms.users++;
      }
    });

    return NextResponse.json({
      status: 'healthy',
      message: 'WebSocket server is running',
      stats,
      features: {
        activities: true,
        notifications: true,
        presence: true,
        customEvents: true
      },
      config: {
        transports: ['websocket', 'polling'],
        path: '/socket.io/',
        cors: {
          enabled: true,
          origin: process.env.NEXTAUTH_URL || '*'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('WebSocket health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check WebSocket health',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}