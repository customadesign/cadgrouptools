import { POST as registerHandler } from '../auth/register/route';
import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/models/User');
jest.mock('@/lib/emailService', () => ({
  default: {
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  },
}));

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePassword123!',
      }),
    });

    // Mock User.findOne to return null (user doesn't exist)
    (User.findOne as jest.Mock).mockResolvedValue(null);

    // Mock User.create to return a new user
    const mockUser = {
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      isActive: true,
    };
    (User.create as jest.Mock).mockResolvedValue(mockUser);

    const response = await registerHandler(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('User registered successfully');
    expect(data.user).toEqual({
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    });
  });

  it('should reject registration with existing email', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'SecurePassword123!',
      }),
    });

    // Mock User.findOne to return an existing user
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'existingUser',
      email: 'existing@example.com',
    });

    const response = await registerHandler(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User with this email already exists');
  });

  it('should validate required fields', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        // Missing email and password
      }),
    });

    const response = await registerHandler(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name, email, and password are required');
  });

  it('should validate email format', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'invalid-email',
        password: 'SecurePassword123!',
      }),
    });

    const response = await registerHandler(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email format');
  });

  it('should enforce password requirements', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
      }),
    });

    const response = await registerHandler(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Password must be at least 8 characters');
  });
});
