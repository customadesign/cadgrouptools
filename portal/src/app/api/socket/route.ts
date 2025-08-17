import { NextRequest, NextResponse } from 'next/server';

// This endpoint checks Socket.io server status
export async function GET(request: NextRequest) {
  // Check if Socket.io is initialized via global
  const io = (global as any).io;
  
  if (io) {
    return NextResponse.json({
      status: 'already_initialized',
      message: 'Socket.io server is already running',
      // Can't get online users count without the socketServer class
      // But we know it's running
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
          initialized: !!(global as any).io,
          // Can't get detailed user info without socketServer class
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
        if ((global as any).emitToAll) {
          (global as any).emitToAll(event, data);
          return NextResponse.json({ success: true, message: 'Broadcast sent' });
        } else {
          return NextResponse.json(
            { error: 'Socket.io not initialized' },
            { status: 503 }
          );
        }

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