import { NextResponse } from 'next/server';
import { connectToDatabase, getConnectionState } from '@/lib/db';

export async function GET() {
  try {
    await connectToDatabase();
    const state = getConnectionState();
    return NextResponse.json({ ok: true, state });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


