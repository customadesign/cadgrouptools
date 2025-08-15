import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { File } from '@/models/File';
import { Transaction } from '@/models/Transaction';

// GET: Fetch a single statement with transactions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const statement = await Statement
      .findById(params.id)
      .populate('sourceFile')
      .lean();

    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Get associated transactions
    const transactions = await Transaction
      .find({ statementId: params.id })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...statement,
        transactions,
        transactionsCount: transactions.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching statement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statement', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update a statement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      status,
      accountName,
      bankName,
      month,
      year,
      ocrProvider,
      transactionsFound,
      transactionsImported,
      processingTime,
      errors,
    } = body;

    // Build update object
    const updateData: any = {};
    if (status) updateData.status = status;
    if (accountName) updateData.accountName = accountName;
    if (bankName) updateData.bankName = bankName;
    if (month) updateData.month = month;
    if (year) updateData.year = year;
    if (ocrProvider) updateData.ocrProvider = ocrProvider;
    if (transactionsFound !== undefined) updateData.transactionsFound = transactionsFound;
    if (transactionsImported !== undefined) updateData.transactionsImported = transactionsImported;
    if (processingTime !== undefined) updateData.processingTime = processingTime;
    if (errors) updateData.errors = errors;

    const statement = await Statement
      .findByIdAndUpdate(
        params.id,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('sourceFile');

    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: statement,
    });
  } catch (error: any) {
    console.error('Error updating statement:', error);
    return NextResponse.json(
      { error: 'Failed to update statement', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a single statement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find statement to get file reference
    const statement = await Statement.findById(params.id);
    
    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Delete associated file
    if (statement.sourceFile) {
      await File.findByIdAndDelete(statement.sourceFile);
    }

    // Delete associated transactions
    await Transaction.deleteMany({ statementId: params.id });

    // Delete statement
    await Statement.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Statement deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting statement:', error);
    return NextResponse.json(
      { error: 'Failed to delete statement', details: error.message },
      { status: 500 }
    );
  }
}