import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { Transaction } from '@/models/Transaction';
import { File } from '@/models/File';
import { Types } from 'mongoose';
import { supabaseAdmin, STORAGE_BUCKET, SUPABASE_STATUS } from '@/lib/supabaseAdmin';

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
    const body = await request.json();

    // Validate MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid statement ID format' },
        { status: 400 }
      );
    }

    // Update the statement
    const updatedStatement = await Statement.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('sourceFile');

    if (!updatedStatement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedStatement,
    });
  } catch (error: any) {
    console.error('Error updating statement:', error);
    return NextResponse.json(
      { error: 'Failed to update statement', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a statement and all associated data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const debugLog: any[] = [];
  
  const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    debugLog.push(logEntry);
    console.log(`[${timestamp}] ${message}`, data || '');
  };

  try {
    log('=== Starting DELETE operation ===');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = params;

    log('Connected to database', { statementId: id });

    // Validate MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid statement ID format' },
        { status: 400 }
      );
    }

    // Fetch the statement with file details
    const statement = await Statement.findById(id).populate('sourceFile');
    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    log('Statement found', { 
      id: statement._id,
      fileName: statement.sourceFile?.fileName,
      storageProvider: statement.sourceFile?.storageProvider
    });

    // Delete all associated transactions
    log('Deleting associated transactions...');
    const transactionDeleteResult = await Transaction.deleteMany({
      statement: new Types.ObjectId(id)
    });
    log('Transactions deleted', { 
      deletedCount: transactionDeleteResult.deletedCount 
    });

    // Delete the source file from storage and database
    let fileDeleteStatus = 'no_file';
    let storageDeleteResult: any = null;

    if (statement.sourceFile) {
      const fileDoc = statement.sourceFile;
      log('Processing file deletion', { 
        fileId: fileDoc._id,
        storageProvider: fileDoc.storageProvider,
        path: fileDoc.path
      });

      if (fileDoc.storageProvider === 'supabase' && fileDoc.path && supabaseAdmin) {
        log('Deleting from Supabase storage...');
        try {
          const { error } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove([fileDoc.path]);

          if (error) {
            log('Supabase deletion error', { error: error.message });
            fileDeleteStatus = 'supabase_delete_failed';
            storageDeleteResult = {
              success: false,
              provider: 'supabase',
              error: error.message
            };
          } else {
            log('Supabase deletion successful');
            fileDeleteStatus = 'supabase_deleted';
            storageDeleteResult = {
              success: true,
              provider: 'supabase'
            };
          }
        } catch (supabaseError: any) {
          log('Supabase deletion exception', { error: supabaseError.message });
          fileDeleteStatus = 'supabase_delete_failed';
          storageDeleteResult = {
            success: false,
            provider: 'supabase',
            error: supabaseError.message
          };
        }
      } else {
        log('File storage provider not recognized or no path', { 
          provider: fileDoc.storageProvider,
          hasPath: !!fileDoc.path
        });
        fileDeleteStatus = 'unknown_provider';
      }
      
      // Always delete file record from database
      log('Deleting file record from database...');
      try {
        const fileDeleteResult = await File.findByIdAndDelete(
          fileDoc._id || statement.sourceFile
        );
        log('File record deleted from database', { 
          deletedId: fileDeleteResult?._id 
        });
      } catch (dbError: any) {
        log('Error deleting file from database', { 
          error: dbError.message 
        });
      }
    } else {
      log('No source file associated with statement');
    }

    // Delete the statement
    log('Deleting statement from database...');
    const deletedStatement = await Statement.findByIdAndDelete(id);
    log('Statement deleted', { id: deletedStatement?._id });

    const response = {
      success: true,
      message: 'Statement and associated data deleted successfully',
      deletedTransactions: transactionDeleteResult.deletedCount,
      fileDeleteStatus,
      storageDeleteResult,
      debugInfo: {
        totalTime: Date.now() - startTime,
        steps: debugLog.length,
        supabaseBucket: STORAGE_BUCKET,
        hasSupabaseClient: !!supabaseAdmin,
        supabaseStatus: SUPABASE_STATUS
      }
    };
    
    log('=== DELETE operation completed successfully ===', response);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    log('FATAL ERROR in DELETE operation', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to delete statement', 
        details: error.message,
        debugLog,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}