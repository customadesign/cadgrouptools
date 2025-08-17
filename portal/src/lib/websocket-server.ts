// WebSocket Server for Real-time Notifications
// This is a separate WebSocket server that runs alongside Next.js
// To use: node src/lib/websocket-server.js or integrate with your deployment

import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = process.env.WS_PORT || 3001;

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store connected clients with their user IDs
const clients = new Map();

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  // Generate a unique client ID
  const clientId = Math.random().toString(36).substring(7);
  
  // Store the client
  clients.set(clientId, { ws, userId: null });
  
  // Handle authentication
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'auth') {
        // Associate user ID with this connection
        const client = clients.get(clientId);
        if (client) {
          client.userId = data.userId;
          ws.send(JSON.stringify({ type: 'auth_success' }));
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(clientId);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(clientId);
  });
  
  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to notification server',
  }));
});

// Function to send notification to specific user
export function sendNotificationToUser(userId: string, notification: any) {
  clients.forEach((client) => {
    if (client.userId === userId && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify({
        type: 'notification',
        payload: notification,
      }));
    }
  });
}

// Function to broadcast to all connected clients
export function broadcastNotification(notification: any) {
  clients.forEach((client) => {
    if (client.ws.readyState === 1) {
      client.ws.send(JSON.stringify({
        type: 'notification',
        payload: notification,
      }));
    }
  });
}

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing WebSocket server');
  wss.close(() => {
    server.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });
});