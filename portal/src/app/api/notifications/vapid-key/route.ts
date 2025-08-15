import { NextResponse } from 'next/server';
import pushNotificationService from '@/services/pushNotificationService';

export async function GET() {
  try {
    const publicKey = pushNotificationService.getVapidPublicKey();
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publicKey,
    });
  } catch (error) {
    console.error('Error fetching VAPID public key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VAPID public key' },
      { status: 500 }
    );
  }
}