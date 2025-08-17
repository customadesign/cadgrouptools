import { NextRequest, NextResponse } from 'next/server';
import { createServer } from 'http';
import { socketServer } from '@/lib/socketServer';

// This endpoint initializes Socket.io server
// Note: In production, you might want to initialize this in a custom server setup
export async function GET(request: NextRequest) {
  // Check if Socket.io is already initialized
  if (socketServer.getIO()) {
    return NextResponse.json({
      status: 'already_initialized',
      message: 'Socket.io server is already running',
      onlineUsers: socketServer.getOnlineUsersCount(),
    });
  }

  return NextResponse.json({
    status: 'not_initialized',
    message: 'Socket.io server needs to be initialized with a custom server setup',
    instructions: 'Please set up a custom server.js file for Socket.io support in production',
  });
}

// Endpoint to get current socket server status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'status':
        return NextResponse.json({
          initialized: !!socketServer.getIO(),
          onlineUsers: socketServer.getOnlineUsersCount(),
          onlineUserIds: socketServer.getOnlineUserIds(),
        });

      case 'broadcast':
        // Admin only - broadcast a message to all users
        const { event, data } = body;
        if (!event || !data) {
          return NextResponse.json(
            { error: 'Event and data are required for broadcast' },
            { status: 400 }
          );
        }
        socketServer.emitToAll(event, data);
        return NextResponse.json({ success: true, message: 'Broadcast sent' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Socket API error:', error);
    return NextResponse.json(
      { error: 'Socket operation failed' },
      { status: 500 }
    );
  }
}