import { Server as SocketIOServer } from 'socket.io';

/**
 * Get the Socket.io server instance
 * This is set globally by the custom server
 */
export function getIO(): SocketIOServer | null {
  if (typeof global !== 'undefined' && (global as any).io) {
    return (global as any).io;
  }
  return null;
}

/**
 * Emit an event to specific user(s)
 */
export function emitToUser(userId: string, event: string, data: any) {
  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit an event to all connected clients
 */
export function emitToAll(event: string, data: any) {
  const io = getIO();
  if (io) {
    io.emit(event, data);
  }
}

/**
 * Emit an activity event with filters
 */
export function emitActivity(activity: any, filters?: {
  userId?: string;
  resourceType?: string;
  actionType?: string;
}) {
  const io = getIO();
  if (!io) return;

  // Emit to specific filtered rooms
  if (filters?.userId) {
    io.to(`activities:user:${filters.userId}`).emit('activity:new', activity);
  }
  if (filters?.resourceType) {
    io.to(`activities:resource:${filters.resourceType}`).emit('activity:new', activity);
  }
  if (filters?.actionType) {
    io.to(`activities:action:${filters.actionType}`).emit('activity:new', activity);
  }
  
  // Always emit to general activities room
  io.to('activities:all').emit('activity:new', activity);
}

/**
 * Emit a notification to a specific user
 */
export function emitNotification(userId: string, notification: any) {
  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
    io.to(`notifications:${userId}`).emit('notification:new', notification);
  }
}

/**
 * Emit activity stats update
 */
export function emitActivityStats(stats: any) {
  const io = getIO();
  if (io) {
    io.to('activities:all').emit('activity:stats', stats);
  }
}

/**
 * Check if WebSocket server is available
 */
export function isWebSocketAvailable(): boolean {
  return getIO() !== null;
}