// Test endpoint to verify database connection and transactions
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Types } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('statement');
    
    // Build query
    const filter: any = {};
    if (statementId && Types.ObjectId.isValid(statementId)) {
      filter.statement = new Types.ObjectId(statementId);
    }
    
    // Get transaction count
    const count = await Transaction.countDocuments(filter);
    
    // Get sample transactions
    const transactions = await Transaction
      .find(filter)
      .limit(5)
      .lean();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      statementId: statementId,
      totalCount: count,
      sampleCount: transactions.length,
      samples: transactions.map(t => ({
        id: t._id,
        date: t.txnDate,
        description: t.description,
        amount: t.amount,
        direction: t.direction
      }))
    });
  } catch (error: any) {
    console.error('[Test API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}