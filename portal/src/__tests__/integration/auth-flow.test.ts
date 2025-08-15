import { createMocks } from 'node-mocks-http';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as loginHandler } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import mongoose from 'mongoose';

// Mock environment
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

describe('Authentication Flow Integration', () => {
  beforeAll(async () => {
    // Connect to test database
    await connectToDatabase();
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  it('should complete full authentication flow', async () => {
    const testUser = {
      name: 'Integration Test User',
      email: 'integration@test.com',
      password: 'IntegrationTest123!',
    };

    // Step 1: Register user
    const registerReq = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const registerRes = await registerHandler(registerReq);
    const registerData = await registerRes.json();

    expect(registerRes.status).toBe(201);
    expect(registerData.user.email).toBe(testUser.email);

    // Step 2: Verify user exists in database
    const dbUser = await User.findOne({ email: testUser.email });
    expect(dbUser).toBeTruthy();
    expect(dbUser?.name).toBe(testUser.name);
    expect(dbUser?.isActive).toBe(true);

    // Step 3: Attempt login with correct credentials
    // Note: NextAuth login is more complex and typically requires session handling
    // This is a simplified example
    const loginReq = new Request('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    // In a real test, you would test the NextAuth callbacks
    // For now, we'll just verify the user can be authenticated
    const { verifyPassword } = require('@/lib/auth');
    const isValidPassword = await verifyPassword(testUser.password, dbUser.password);
    expect(isValidPassword).toBe(true);

    // Step 4: Attempt login with incorrect password
    const invalidPassword = await verifyPassword('WrongPassword', dbUser.password);
    expect(invalidPassword).toBe(false);

    // Step 5: Test duplicate registration
    const duplicateReq = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const duplicateRes = await registerHandler(duplicateReq);
    const duplicateData = await duplicateRes.json();

    expect(duplicateRes.status).toBe(400);
    expect(duplicateData.error).toContain('already exists');
  });

  it('should handle invalid registration data', async () => {
    const invalidUsers = [
      { name: '', email: 'test@test.com', password: 'Test123!' }, // Empty name
      { name: 'Test', email: 'invalid-email', password: 'Test123!' }, // Invalid email
      { name: 'Test', email: 'test@test.com', password: '123' }, // Weak password
      { name: 'Test', email: '', password: 'Test123!' }, // Empty email
    ];

    for (const invalidUser of invalidUsers) {
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUser),
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(400);
    }
  });

  it('should handle database connection errors gracefully', async () => {
    // Temporarily close connection to simulate error
    await mongoose.connection.close();

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@test.com',
        password: 'Test123!',
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(500);

    // Reconnect for cleanup
    await connectToDatabase();
  });
});
