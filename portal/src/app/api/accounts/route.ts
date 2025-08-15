import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Account } from '@/models/Account';
import { withStatelessAuth } from '@/lib/auth-stateless';
import { withActivityTracking } from '@/middleware/activityTracking';

// GET /api/accounts - List all accounts
export const GET = withStatelessAuth(withActivityTracking(async (request: NextRequest) => {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const bankName = searchParams.get('bankName') || '';

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (bankName) {
      query.bankName = { $regex: bankName, $options: 'i' };
    }

    const accounts = await Account.find(query).sort({ name: 1 });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}));

// POST /api/accounts - Create a new account
export const POST = withStatelessAuth(withActivityTracking(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { 
      name, 
      bankName, 
      accountNumber, 
      currency, 
      type,
      status,
      notes 
    } = body;

    // Validation
    if (!name || !bankName) {
      return NextResponse.json(
        { error: 'Account name and bank name are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check for duplicate
    const existing = await Account.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
      bankName: { $regex: `^${bankName}$`, $options: 'i' },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this name and bank already exists' },
        { status: 409 }
      );
    }

    // Create account
    const account = await Account.create({
      name,
      bankName,
      accountNumber: accountNumber ? accountNumber.slice(-4) : undefined, // Store only last 4 digits
      currency: currency || 'USD',
      type: type || 'checking',
      status: status || 'active',
      notes,
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}));
