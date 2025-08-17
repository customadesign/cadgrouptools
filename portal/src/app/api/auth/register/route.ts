import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import pushNotificationService from '@/services/pushNotificationService';
import { notificationService } from '@/services/notificationService';
import { validators, passwordPolicy } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = validators.sanitizeString(name);
    const sanitizedEmail = email.toLowerCase().trim();

    // Email format validation
    if (!validators.email(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    const passwordValidation = passwordPolicy.validate(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      role: role || 'staff',
      isActive: true,
    });

    // Send push notification to admins about new user registration
    try {
      await pushNotificationService.notifyNewUserRegistration({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (notificationError) {
      // Log error but don't fail the registration
      console.error('Failed to send push notification for new user registration:', notificationError);
    }

    // Send real-time notification to admins
    try {
      await notificationService.notifyUserRegistration({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (notificationError) {
      // Log error but don't fail the registration
      console.error('Failed to send real-time notification for new user registration:', notificationError);
    }

    // Return user data (without password)
    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}