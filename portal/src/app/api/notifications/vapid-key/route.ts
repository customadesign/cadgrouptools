import { NextResponse } from 'next/server';
import pushNotificationService from '@/services/pushNotificationService';

export async function GET() {
  try {
    const publicKey = pushNotificationService.getVapidPublicKey();
    
    return NextResponse.json({
      publicKey
    });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return NextResponse.json(
      { error: 'Failed to get VAPID public key' },
      { status: 500 }
    );
  }
}