import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { Transaction } from '@/models/Transaction';
import { File } from '@/models/File';
import { Types } from 'mongoose';
import { supabaseAdmin, STORAGE_BUCKET, SUPABASE_STATUS } from '@/lib/supabaseAdmin';
import { getS3Client, BUCKET as S3_BUCKET } from '@/lib/s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

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
  const startTime = Date.now();
  const debugLog: any[] = [];
  
  const log = (message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - startTime,
      message,
      data
    };
    console.log(`[DELETE ${id}] ${message}`, data || '');
    debugLog.push(logEntry);
  };

  try {
    log('=== Starting DELETE operation ===');
    
    // Authentication check
    log('Checking authentication...');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      log('Authentication failed - no session');
      return NextResponse.json({ 
        error: 'Unauthorized',
        debugLog 
      }, { status: 401 });
    }
    log('Authentication successful', { user: session.user.email });

    // Database connection
    log('Connecting to database...');
    await connectToDatabase();
    log('Database connected');

    const { id } = params;
    log('Processing statement ID', { id });

    // Validate MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      log('Invalid ObjectId format', { id });
      return NextResponse.json(
        { 
          error: 'Invalid statement ID format',
          debugLog 
        },
        { status: 400 }
      );
    }

    // Find the statement
    log('Finding statement in database...');
    const statement = await Statement.findById(id).populate('sourceFile');

    if (!statement) {
      log('Statement not found in database', { id });
      return NextResponse.json(
        { 
          error: 'Statement not found',
          debugLog 
        },
        { status: 404 }
      );
    }
    
    log('Statement found', {
      id: statement._id,
      hasSourceFile: !!statement.sourceFile,
      accountName: statement.accountName,
      month: statement.month,
      year: statement.year
    });

    // Delete associated transactions
    log('Deleting associated transactions...');
    const transactionDeleteResult = await Transaction.deleteMany({
      statement: statement._id,
    });
    log('Transactions deleted', { count: transactionDeleteResult.deletedCount });

    // Handle file deletion
    let fileDeleteStatus = 'no_file';
    let storageDeleteResult = null;
    
    if (statement.sourceFile) {
      const fileDoc = statement.sourceFile as any;
      
      log('Processing file deletion', {
        fileId: fileDoc._id,
        originalName: fileDoc.originalName,
        storageProvider: fileDoc.storageProvider,
        path: fileDoc.path,
        hasSupabaseAdmin: !!supabaseAdmin,
        supabaseStatus: SUPABASE_STATUS,
        hasS3Client: !!getS3Client(),
        s3Bucket: S3_BUCKET,
        storageBucket: STORAGE_BUCKET
      });
      
      // Check if we should delete from Supabase
      if (fileDoc.storageProvider === 'supabase') {
        if (!supabaseAdmin) {
          log('ERROR: Supabase admin client not initialized', {
            hasUrl: !!process.env.SUPABASE_URL,
            hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE,
            urlValue: process.env.SUPABASE_URL?.substring(0, 30) + '...',
          });
          fileDeleteStatus = 'supabase_not_configured';
        } else if (!fileDoc.path) {
          log('ERROR: File path is missing', { fileDoc });
          fileDeleteStatus = 'missing_path';
        } else {
          try {
            log('Attempting Supabase deletion...');
            
            // First, list files to check if it exists
            log('Listing files in bucket to verify existence...');
            const { data: listData, error: listError } = await supabaseAdmin
              .storage
              .from(STORAGE_BUCKET)
              .list(fileDoc.path.split('/').slice(0, -1).join('/'), {
                limit: 100,
                search: fileDoc.path.split('/').pop()
              });
            
            if (listError) {
              log('Error listing files', { error: listError });
            } else {
              log('Files in directory', { 
                count: listData?.length || 0,
                files: listData?.map(f => f.name) 
              });
            }
            
            // Attempt deletion regardless of list result
            log('Executing Supabase delete operation...');
            const { data: deleteData, error: deleteError } = await supabaseAdmin
              .storage
              .from(STORAGE_BUCKET)
              .remove([fileDoc.path]);
            
            if (deleteError) {
              log('Supabase deletion error', {
                error: deleteError,
                message: deleteError.message,
                status: (deleteError as any).status,
                statusCode: (deleteError as any).statusCode,
                details: (deleteError as any).details
              });
              fileDeleteStatus = 'supabase_delete_failed';
              storageDeleteResult = {
                success: false,
                error: deleteError.message
              };
            } else {
              log('Supabase deletion response', { data: deleteData });
              
              // Verify deletion
              log('Verifying file deletion...');
              const { data: verifyData, error: verifyError } = await supabaseAdmin
                .storage
                .from(STORAGE_BUCKET)
                .download(fileDoc.path);
              
              if (verifyError) {
                if (verifyError.message.includes('not found') || 
                    verifyError.message.includes('Object not found')) {
                  log('Deletion verified - file no longer exists');
                  fileDeleteStatus = 'supabase_deleted';
                  storageDeleteResult = {
                    success: true,
                    verified: true
                  };
                } else {
                  log('Unexpected verification error', { error: verifyError });
                  fileDeleteStatus = 'supabase_delete_uncertain';
                  storageDeleteResult = {
                    success: true,
                    verified: false,
                    verifyError: verifyError.message
                  };
                }
              } else {
                log('WARNING: File still exists after deletion attempt');
                fileDeleteStatus = 'supabase_delete_failed_still_exists';
                storageDeleteResult = {
                  success: false,
                  error: 'File still exists after deletion'
                };
              }
            }
          } catch (supabaseError: any) {
            log('Unexpected Supabase error', {
              error: supabaseError.message,
              stack: supabaseError.stack,
              name: supabaseError.name
            });
            fileDeleteStatus = 'supabase_exception';
            storageDeleteResult = {
              success: false,
              error: supabaseError.message
            };
          }
        }
      } else if (fileDoc.storageProvider === 's3' || (!supabaseAdmin && fileDoc.path)) {
        // Try S3 deletion
        log('Attempting S3 deletion...');
        const s3Client = getS3Client();
        
        if (!s3Client) {
          log('ERROR: S3 client not configured', {
            hasBucket: !!S3_BUCKET,
            hasRegion: !!process.env.S3_REGION,
            hasAccessKey: !!process.env.S3_ACCESS_KEY_ID
          });
          fileDeleteStatus = 's3_not_configured';
        } else if (!S3_BUCKET) {
          log('ERROR: S3 bucket not configured');
          fileDeleteStatus = 's3_bucket_missing';
        } else {
          try {
            log('Executing S3 delete operation...', {
              bucket: S3_BUCKET,
              key: fileDoc.path
            });
            
            const deleteCommand = new DeleteObjectCommand({
              Bucket: S3_BUCKET,
              Key: fileDoc.path
            });
            
            const s3Response = await s3Client.send(deleteCommand);
            
            log('S3 deletion response', {
              statusCode: s3Response.$metadata.httpStatusCode,
              requestId: s3Response.$metadata.requestId
            });
            
            // S3 delete always returns 204 even if object doesn't exist
            fileDeleteStatus = 's3_deleted';
            storageDeleteResult = {
              success: true,
              provider: 's3',
              statusCode: s3Response.$metadata.httpStatusCode
            };
            
          } catch (s3Error: any) {
            log('S3 deletion error', {
              error: s3Error.message,
              code: s3Error.Code,
              statusCode: s3Error.$metadata?.httpStatusCode
            });
            fileDeleteStatus = 's3_delete_failed';
            storageDeleteResult = {
              success: false,
              provider: 's3',
              error: s3Error.message
            };
          }
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
        s3Bucket: S3_BUCKET,
        hasSupabaseClient: !!supabaseAdmin,
        hasS3Client: !!getS3Client(),
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