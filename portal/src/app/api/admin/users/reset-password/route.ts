import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import userEmailService from '@/services/userEmailService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { userId, sendEmail = true } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Generate new temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    
    // Update user with new password and require password change
    user.password = hashedPassword;
    user.requirePasswordChange = true;
    user.lastPasswordReset = new Date();
    await user.save();
    
    let emailSent = false;
    if (sendEmail) {
      const adminUser = await User.findById(session.user.id);
      emailSent = await userEmailService.sendPasswordReset({
        name: user.name,
        email: user.email,
        tempPassword,
        resetBy: adminUser?.email || 'administrator@cadgroupmgt.com'
      });
      
      if (!emailSent) {
        console.warn('Failed to send password reset email to:', user.email);
      }
    }
    
    return NextResponse.json({ 
      message: emailSent 
        ? 'Password reset successfully. Email has been sent to the user.'
        : 'Password reset successfully. Failed to send email notification.',
      tempPassword, // Still return for development/testing, remove in production
      email: user.email,
      emailSent
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}