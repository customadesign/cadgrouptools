const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Store io instance globally for use in API routes
  global.io = io;

  // Simple WebSocket handling
  const userSockets = new Map(); // userId -> Set of socket ids

  io.on('connection', (socket) => {
    console.log('New WebSocket connection:', socket.id);

    // Handle authentication
    socket.on('authenticate', (data) => {
      if (data.userId) {
        socket.userId = data.userId;
        
        // Track user's socket
        if (!userSockets.has(data.userId)) {
          userSockets.set(data.userId, new Set());
        }
        userSockets.get(data.userId).add(socket.id);
        
        socket.join(`user:${data.userId}`);
        console.log(`User ${data.userId} authenticated on socket ${socket.id}`);
        
        socket.emit('authenticated', { success: true });
      }
    });

    // Handle joining rooms
    socket.on('join', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Handle leaving rooms
    socket.on('leave', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      
      // Remove from user tracking
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    });

    // Handle ping for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  // Helper function to emit to specific user
  global.emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  // Helper function to emit to all users
  global.emitToAll = (event, data) => {
    io.emit(event, data);
  };

  // Helper function to emit to a room
  global.emitToRoom = (room, event, data) => {
    io.to(room).emit(event, data);
  };

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('> Socket.io server initialized');
    console.log('> Environment:', process.env.NODE_ENV || 'development');
  });
});