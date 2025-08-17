#!/usr/bin/env node

/**
 * WebSocket Connection Test Script
 * Tests WebSocket connectivity and functionality
 */

const io = require('socket.io-client');
const chalk = require('chalk');

// Configuration
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'http://localhost:3000';
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_DURATION = 30000; // 30 seconds

console.log(chalk.blue('===================================='));
console.log(chalk.blue('WebSocket Connection Test'));
console.log(chalk.blue('===================================='));
console.log(chalk.yellow(`URL: ${WEBSOCKET_URL}`));
console.log(chalk.yellow(`Test User: ${TEST_USER_ID}`));
console.log(chalk.yellow(`Duration: ${TEST_DURATION / 1000} seconds`));
console.log('');

// Connection metrics
let connectionTime = null;
let messagesReceived = 0;
let messagesSent = 0;
let errors = 0;

// Create socket connection
console.log(chalk.cyan('Connecting to WebSocket server...'));
const socket = io(WEBSOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connection events
socket.on('connect', () => {
  connectionTime = Date.now();
  console.log(chalk.green('✓ Connected successfully!'));
  console.log(chalk.gray(`Socket ID: ${socket.id}`));
  console.log(chalk.gray(`Transport: ${socket.io.engine.transport.name}`));
  
  // Authenticate
  console.log(chalk.cyan('Authenticating...'));
  socket.emit('authenticate', { userId: TEST_USER_ID });
  messagesSent++;
  
  // Subscribe to various rooms
  setTimeout(() => {
    console.log(chalk.cyan('Subscribing to activities...'));
    socket.emit('subscribe:activities', {});
    messagesSent++;
    
    console.log(chalk.cyan('Subscribing to presence...'));
    socket.emit('subscribe:presence');
    messagesSent++;
    
    console.log(chalk.cyan('Subscribing to notifications...'));
    socket.emit('subscribe:notifications', { userId: TEST_USER_ID });
    messagesSent++;
  }, 1000);
  
  // Send test events
  setTimeout(() => {
    console.log(chalk.cyan('Sending test activity...'));
    socket.emit('activity:broadcast', {
      activity: {
        type: 'test',
        message: 'Test activity from WebSocket test script',
        timestamp: new Date().toISOString()
      },
      filters: {}
    });
    messagesSent++;
  }, 2000);
});

socket.on('disconnect', (reason) => {
  console.log(chalk.red(`✗ Disconnected: ${reason}`));
});

socket.on('error', (error) => {
  errors++;
  console.log(chalk.red(`✗ Error: ${error.message || error}`));
});

// Reconnection events
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(chalk.yellow(`Reconnection attempt ${attemptNumber}...`));
});

socket.on('reconnect', (attemptNumber) => {
  console.log(chalk.green(`✓ Reconnected after ${attemptNumber} attempts`));
});

socket.on('reconnect_failed', () => {
  console.log(chalk.red('✗ Failed to reconnect'));
});

// Listen for events
socket.on('connected', (data) => {
  messagesReceived++;
  console.log(chalk.green('✓ Received connected event'), chalk.gray(JSON.stringify(data)));
});

socket.on('user:online', (data) => {
  messagesReceived++;
  console.log(chalk.green('✓ User online:'), chalk.gray(JSON.stringify(data)));
});

socket.on('user:offline', (data) => {
  messagesReceived++;
  console.log(chalk.green('✓ User offline:'), chalk.gray(JSON.stringify(data)));
});

socket.on('activity:new', (data) => {
  messagesReceived++;
  console.log(chalk.green('✓ New activity:'), chalk.gray(JSON.stringify(data).substring(0, 100) + '...'));
});

socket.on('activity:stats', (data) => {
  messagesReceived++;
  console.log(chalk.green('✓ Activity stats:'), chalk.gray(JSON.stringify(data)));
});

socket.on('notification:new', (data) => {
  messagesReceived++;
  console.log(chalk.green('✓ New notification:'), chalk.gray(JSON.stringify(data)));
});

socket.on('presence:current', (data) => {
  messagesReceived++;
  console.log(chalk.green('✓ Current presence:'), chalk.gray(`${data.onlineUsers.length} users online`));
});

// Ping/pong for latency measurement
let pingStart = null;
setInterval(() => {
  if (socket.connected) {
    pingStart = Date.now();
    socket.emit('ping');
  }
}, 5000);

socket.on('pong', () => {
  if (pingStart) {
    const latency = Date.now() - pingStart;
    console.log(chalk.blue(`Latency: ${latency}ms`));
  }
});

// Test health endpoint
const testHealthEndpoint = async () => {
  try {
    const url = WEBSOCKET_URL.replace('ws://', 'http://').replace('wss://', 'https://');
    const response = await fetch(`${url}/api/websocket/health`);
    const data = await response.json();
    
    console.log('');
    console.log(chalk.cyan('Health Check Result:'));
    console.log(chalk.gray(JSON.stringify(data, null, 2)));
    console.log('');
  } catch (error) {
    console.log(chalk.red('✗ Health check failed:'), error.message);
  }
};

// Run health check after connection
setTimeout(testHealthEndpoint, 3000);

// Summary after test duration
setTimeout(() => {
  console.log('');
  console.log(chalk.blue('===================================='));
  console.log(chalk.blue('Test Summary'));
  console.log(chalk.blue('===================================='));
  
  if (socket.connected) {
    console.log(chalk.green('✓ Connection Status: Connected'));
    console.log(chalk.gray(`Connection Duration: ${((Date.now() - connectionTime) / 1000).toFixed(1)}s`));
  } else {
    console.log(chalk.red('✗ Connection Status: Disconnected'));
  }
  
  console.log(chalk.gray(`Messages Sent: ${messagesSent}`));
  console.log(chalk.gray(`Messages Received: ${messagesReceived}`));
  console.log(chalk.gray(`Errors: ${errors}`));
  
  // Disconnect and exit
  console.log('');
  console.log(chalk.yellow('Disconnecting...'));
  socket.disconnect();
  
  setTimeout(() => {
    console.log(chalk.green('✓ Test complete'));
    process.exit(errors > 0 ? 1 : 0);
  }, 1000);
}, TEST_DURATION);

// Handle process termination
process.on('SIGINT', () => {
  console.log('');
  console.log(chalk.yellow('Interrupted. Cleaning up...'));
  socket.disconnect();
  process.exit(0);
});

// Keep process alive
process.stdin.resume();