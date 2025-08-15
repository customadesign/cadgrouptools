import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Statement } from '@/models/Statement';
import { Types } from 'mongoose';
import { withActivityTracking } from '@/middleware/activityTracking';

// GET: Fetch transactions with filtering and pagination
export const GET = withActivityTracking(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const statementId = searchParams.get('statement');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const direction = searchParams.get('direction');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    // Build filter
    const filter: any = {};
    
    if (statementId && Types.ObjectId.isValid(statementId)) {
      filter.statement = new Types.ObjectId(statementId);
    }

    if (startDate || endDate) {
      filter.txnDate = {};
      if (startDate) filter.txnDate.$gte = new Date(startDate);
      if (endDate) filter.txnDate.$lte = new Date(endDate);
    }

    if (direction && ['debit', 'credit'].includes(direction)) {
      filter.direction = direction;
    }

    if (category) {
      filter.category = category;
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { checkNo: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await Transaction.countDocuments(filter);

    // Fetch transactions with pagination
    const transactions = await Transaction
      .find(filter)
      .populate({
        path: 'statement',
        select: 'accountName bankName month year status',
      })
      .sort({ txnDate: -1, createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Calculate summary statistics
    const summary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$direction',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const debitSummary = summary.find(s => s._id === 'debit') || { totalAmount: 0, count: 0 };
    const creditSummary = summary.find(s => s._id === 'credit') || { totalAmount: 0, count: 0 };

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        totalDebits: debitSummary.totalAmount,
        totalCredits: creditSummary.totalAmount,
        debitCount: debitSummary.count,
        creditCount: creditSummary.count,
        netAmount: creditSummary.totalAmount - debitSummary.totalAmount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    );
  }
});

// POST: Create new transactions (bulk support)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { transactions, statementId } = body;

    // Validate statement exists
    if (!statementId || !Types.ObjectId.isValid(statementId)) {
      return NextResponse.json(
        { error: 'Invalid or missing statement ID' },
        { status: 400 }
      );
    }

    const statement = await Statement.findById(statementId);
    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Handle single transaction
    if (!Array.isArray(transactions)) {
      const transaction = await Transaction.create({
        ...body,
        statement: statementId,
      });

      return NextResponse.json({
        success: true,
        data: transaction,
      });
    }

    // Handle bulk transactions
    const transactionDocs = transactions.map(txn => ({
      ...txn,
      statement: statementId,
      txnDate: new Date(txn.txnDate || txn.date),
    }));

    const createdTransactions = await Transaction.insertMany(transactionDocs);

    // Update statement status if needed
    if (statement.status === 'extracted' || statement.status === 'processing') {
      await Statement.findByIdAndUpdate(statementId, {
        status: 'completed',
      });
    }

    return NextResponse.json({
      success: true,
      data: createdTransactions,
      count: createdTransactions.length,
    });
  } catch (error: any) {
    console.error('Error creating transactions:', error);
    return NextResponse.json(
      { error: 'Failed to create transactions', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete multiple transactions
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No transaction IDs provided' },
        { status: 400 }
      );
    }

    // Validate all IDs are valid ObjectIds
    const validIds = ids.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some transaction IDs are invalid' },
        { status: 400 }
      );
    }

    // Delete transactions
    const result = await Transaction.deleteMany({
      _id: { $in: validIds.map(id => new Types.ObjectId(id)) },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Error deleting transactions:', error);
    return NextResponse.json(
      { error: 'Failed to delete transactions', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Bulk update transactions (e.g., categorize, reconcile)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { ids, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No transaction IDs provided' },
        { status: 400 }
      );
    }

    // Validate all IDs are valid ObjectIds
    const validIds = ids.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some transaction IDs are invalid' },
        { status: 400 }
      );
    }

    // Allowed fields for bulk update
    const allowedUpdates = ['category', 'confidence'];
    const updateFields: any = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateFields[key] = updates[key];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    // Update transactions
    const result = await Transaction.updateMany(
      { _id: { $in: validIds.map(id => new Types.ObjectId(id)) } },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    });
  } catch (error: any) {
    console.error('Error updating transactions:', error);
    return NextResponse.json(
      { error: 'Failed to update transactions', details: error.message },
      { status: 500 }
    );
  }
}