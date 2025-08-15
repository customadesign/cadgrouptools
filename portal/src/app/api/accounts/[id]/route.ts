import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Account } from '@/models/Account';
import { Statement } from '@/models/Statement';
import { requireAuth, requireRole } from '@/lib/auth';

// GET /api/accounts/[id] - Get a single account
export const GET = requireAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;

    await connectToDatabase();

    const account = await Account.findById(id);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
});

// PUT /api/accounts/[id] - Update an account
export const PUT = requireAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      name, 
      bankName, 
      accountNumber, 
      currency, 
      type,
      status,
      balance,
      notes,
      lastImportedAt
    } = body;

    // Validation
    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: 'Account name cannot be empty' },
        { status: 400 }
      );
    }

    if (bankName !== undefined && !bankName) {
      return NextResponse.json(
        { error: 'Bank name cannot be empty' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if account exists
    const existingAccount = await Account.findById(id);
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check for duplicate if name or bankName is being changed
    if ((name && name !== existingAccount.name) || (bankName && bankName !== existingAccount.bankName)) {
      const duplicate = await Account.findOne({
        _id: { $ne: id },
        name: name || existingAccount.name,
        bankName: bankName || existingAccount.bankName,
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Another account with this name and bank already exists' },
          { status: 409 }
        );
      }
    }

    // Update account
    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      {
        ...(name !== undefined && { name }),
        ...(bankName !== undefined && { bankName }),
        ...(accountNumber !== undefined && { accountNumber: accountNumber ? accountNumber.slice(-4) : undefined }),
        ...(currency !== undefined && { currency }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(balance !== undefined && { balance }),
        ...(notes !== undefined && { notes }),
        ...(lastImportedAt !== undefined && { lastImportedAt }),
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ account: updatedAccount });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
});

// DELETE /api/accounts/[id] - Delete an account (admin only)
export const DELETE = requireRole('admin')(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;

    await connectToDatabase();

    const account = await Account.findById(id);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if account has associated statements
    const hasStatements = await Statement.exists({ account: id });
    if (hasStatements) {
      return NextResponse.json(
        { error: 'Cannot delete account with existing statements' },
        { status: 400 }
      );
    }

    await Account.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
});
