import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// PATCH /api/transactions/:id - Update transaction fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const updates: any = {};

    // Allow specific fields to be updated
    const allowedFields = [
      'checkNo',
      'vendor',
      'category',
      'subcategory',
      'notes',
      'taxDeductible',
      'isReconciled',
      'amount',
      'description',
      'txnDate',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Handle date field conversion
        if (field === 'txnDate' || field === 'date') {
          updates.txnDate = new Date(body[field]);
        } else if (field === 'amount') {
          updates.amount = parseFloat(body.amount);
        } else {
          updates[field] = body[field];
        }
      }
    }

    // If no updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Find and update transaction
    const transaction = await Transaction.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('category', 'name type')
      .populate('subcategory', 'name')
      .populate('company', 'name currency');

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Transaction updated successfully',
      transaction 
    });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/transactions/:id - Get single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const transaction = await Transaction.findById(params.id)
      .populate('category', 'name type')
      .populate('subcategory', 'name')
      .populate('company', 'name currency')
      .lean();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction', details: error.message },
      { status: 500 }
    );
  }
}
