import { Server as HTTPServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface SocketWithUser extends Socket {
  userId?: string;
  userRole?: string;
}

class SocketServer {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socket ids

  initialize(httpServer: HTTPServer) {
    if (this.io) {
      console.log('Socket.io already initialized');
      return this.io;
    }

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log('Socket.io server initialized');
    return this.io;
  }

  private setupMiddleware() {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket: SocketWithUser, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'secret') as any;
        
        if (!decoded.userId) {
          return next(new Error('Authentication error: Invalid token'));
        }

        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: SocketWithUser) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);
      
      if (socket.userId) {
        // Add socket to user's socket set
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId)?.add(socket.id);

        // Join user's personal room
        socket.join(`user:${socket.userId}`);
        
        // If admin, join admin room
        if (socket.userRole === 'admin') {
          socket.join('admins');
        }

        // Join general notifications room
        socket.join('notifications');
      }

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from socket ${socket.id}`);
        
        if (socket.userId) {
          // Remove socket from user's socket set
          const userSocketSet = this.userSockets.get(socket.userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });

      // Handle notification acknowledgment
      socket.on('notification:ack', async (notificationId: string) => {
        console.log(`Notification ${notificationId} acknowledged by user ${socket.userId}`);
        // This can be used for read receipts or analytics
      });

      // Handle request for unread count
      socket.on('notification:unread-count', async () => {
        if (socket.userId) {
          const count = await this.getUnreadCount(socket.userId);
          socket.emit('notification:unread-count', count);
        }
      });
    });
  }

  // Emit notification to specific user
  emitToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      console.warn('Socket.io not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    console.log(`Emitted ${event} to user ${userId}`);
  }

  // Emit notification to all admins
  emitToAdmins(event: string, data: any) {
    if (!this.io) {
      console.warn('Socket.io not initialized');
      return;
    }

    this.io.to('admins').emit(event, data);
    console.log(`Emitted ${event} to all admins`);
  }

  // Emit notification to all connected users
  emitToAll(event: string, data: any) {
    if (!this.io) {
      console.warn('Socket.io not initialized');
      return;
    }

    this.io.to('notifications').emit(event, data);
    console.log(`Emitted ${event} to all users`);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Get list of online user IDs
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Helper method to get unread notification count (implement based on your needs)
  private async getUnreadCount(userId: string): Promise<number> {
    try {
      // Dynamic import to avoid circular dependencies
      const { default: Notification } = await import('@/models/Notification');
      const { connectToDatabase } = await import('@/lib/db');
      
      await connectToDatabase();
      const count = await Notification.countDocuments({
        userId: new Types.ObjectId(userId),
        read: false,
      });
      
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton instance
export const socketServer = new SocketServer();

// Export types
export type { SocketWithUser };