import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { Transaction } from '@/models/Transaction';
import { File } from '@/models/File';
import { Types } from 'mongoose';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';

// GET: Fetch a single statement with its details
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

    const { id } = params;

    // Validate MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid statement ID format' },
        { status: 400 }
      );
    }

    // Fetch statement with populated file reference
    const statement = await Statement
      .findById(id)
      .populate('sourceFile')
      .lean();

    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Fetch associated transactions count
    const transactionCount = await Transaction.countDocuments({
      statement: statement._id,
    });

    // Fetch transaction summary
    const transactionSummary = await Transaction.aggregate([
      { $match: { statement: new Types.ObjectId(id) } },
      {
        $group: {
          _id: '$direction',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Format the response
    const response = {
      ...statement,
      transactionCount,
      transactionSummary: {
        debit: transactionSummary.find(s => s._id === 'debit') || { totalAmount: 0, count: 0 },
        credit: transactionSummary.find(s => s._id === 'credit') || { totalAmount: 0, count: 0 },
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Error fetching statement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statement', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update a statement (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}

// PUT: Update a statement
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;

    // Validate MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid statement ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const allowedUpdates = [
      'accountName',
      'bankName',
      'currency',
      'month',
      'year',
      'status',
      'ocrProvider',
      'pages',
    ];

    // Filter only allowed fields
    const updates: any = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // Update the statement
    const statement = await Statement.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('sourceFile');

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

// DELETE: Delete a single statement and its associated data
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

    const { id } = params;

    // Validate MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid statement ID format' },
        { status: 400 }
      );
    }

    // Find the statement first to get file reference
    const statement = await Statement.findById(id).populate('sourceFile');

    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Delete associated transactions
    const transactionDeleteResult = await Transaction.deleteMany({
      statement: statement._id,
    });

    // Delete file from Supabase storage and database
    if (statement.sourceFile) {
      const fileDoc = statement.sourceFile as any;
      
      // Delete from Supabase storage if it's stored there
      if (fileDoc.storageProvider === 'supabase' && fileDoc.path && supabaseAdmin) {
        try {
          console.log(`Attempting to delete file from Supabase: ${fileDoc.path}`);
          
          const { error: deleteError } = await supabaseAdmin
            .storage
            .from(STORAGE_BUCKET)
            .remove([fileDoc.path]);
          
          if (deleteError) {
            console.error('Supabase file deletion error:', deleteError);
            // Continue with deletion even if Supabase deletion fails
            // This prevents orphaned database records
          } else {
            console.log(`Successfully deleted file from Supabase: ${fileDoc.path}`);
          }
        } catch (supabaseError) {
          console.error('Error deleting from Supabase storage:', supabaseError);
          // Continue with database deletion
        }
      }
      
      // Delete file record from database
      await File.findByIdAndDelete(statement.sourceFile._id || statement.sourceFile);
    }

    // Delete the statement
    await Statement.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Statement and associated data deleted successfully',
      deletedTransactions: transactionDeleteResult.deletedCount,
    });
  } catch (error: any) {
    console.error('Error deleting statement:', error);
    return NextResponse.json(
      { error: 'Failed to delete statement', details: error.message },
      { status: 500 }
    );
  }
}