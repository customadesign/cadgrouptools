import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { File } from '@/models/File';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';
import { Types } from 'mongoose';

interface SyncReport {
  totalStatements: number;
  totalFiles: number;
  orphanedStatements: Array<{
    id: string;
    accountName: string;
    month: number;
    year: number;
    fileName: string;
    fileExists: boolean;
  }>;
  orphanedFiles: Array<{
    id: string;
    fileName: string;
    path: string;
    statementExists: boolean;
  }>;
  validRecords: number;
  supabaseFiles: string[];
  recommendations: string[];
  errors: string[];
}

// GET: Check synchronization status between MongoDB and Supabase
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const report: SyncReport = {
      totalStatements: 0,
      totalFiles: 0,
      orphanedStatements: [],
      orphanedFiles: [],
      validRecords: 0,
      supabaseFiles: [],
      recommendations: [],
      errors: []
    };

    // Check if Supabase is configured
    if (!supabaseAdmin) {
      report.errors.push('Supabase is not configured. Cannot verify file existence.');
      report.recommendations.push('Configure Supabase environment variables to enable file verification.');
      return NextResponse.json({ success: false, data: report });
    }

    try {
      // Get all statements with their file references
      const statements = await Statement.find({})
        .populate('sourceFile')
        .lean();
      
      report.totalStatements = statements.length;

      // Get all files from MongoDB
      const files = await File.find({ storageProvider: 'supabase' }).lean();
      report.totalFiles = files.length;

      // List all files in Supabase storage
      const supabaseFileSet = new Set<string>();
      
      // List files in the statements directory structure
      const years = ['2023', '2024', '2025']; // Add relevant years
      
      for (const year of years) {
        for (let month = 1; month <= 12; month++) {
          const path = `statements/${year}/${month}`;
          
          try {
            const { data: listData, error: listError } = await supabaseAdmin
              .storage
              .from(STORAGE_BUCKET)
              .list(path, {
                limit: 1000,
                offset: 0
              });

            if (!listError && listData) {
              listData.forEach(file => {
                if (file.name) {
                  const fullPath = `${path}/${file.name}`;
                  supabaseFileSet.add(fullPath);
                }
              });
            }
          } catch (error) {
            // Path might not exist, which is fine
            console.log(`Path ${path} might not exist, skipping...`);
          }
        }
      }

      report.supabaseFiles = Array.from(supabaseFileSet);

      // Check each statement for orphaned records
      for (const statement of statements) {
        if (statement.sourceFile) {
          const file = statement.sourceFile as any;
          const filePath = file.path || file.fileName;
          
          if (filePath) {
            // Check if file exists in Supabase
            const fileExistsInSupabase = supabaseFileSet.has(filePath);
            
            if (!fileExistsInSupabase) {
              // Try to verify individual file existence
              const { data: fileData, error: fileError } = await supabaseAdmin
                .storage
                .from(STORAGE_BUCKET)
                .download(filePath);
              
              if (fileError) {
                // File doesn't exist in Supabase
                report.orphanedStatements.push({
                  id: statement._id.toString(),
                  accountName: statement.accountName,
                  month: statement.month,
                  year: statement.year,
                  fileName: file.originalName || file.fileName || 'Unknown',
                  fileExists: false
                });
              } else {
                report.validRecords++;
              }
            } else {
              report.validRecords++;
            }
          } else {
            // No file path available
            report.orphanedStatements.push({
              id: statement._id.toString(),
              accountName: statement.accountName,
              month: statement.month,
              year: statement.year,
              fileName: 'No file path',
              fileExists: false
            });
          }
        } else {
          // Statement has no file reference
          report.orphanedStatements.push({
            id: statement._id.toString(),
            accountName: statement.accountName,
            month: statement.month,
            year: statement.year,
            fileName: 'No file reference',
            fileExists: false
          });
        }
      }

      // Check for orphaned files (files without statements)
      const filePathToStatement = new Map();
      statements.forEach(stmt => {
        if (stmt.sourceFile) {
          const file = stmt.sourceFile as any;
          if (file.path || file.fileName) {
            filePathToStatement.set(file.path || file.fileName, stmt._id);
          }
        }
      });

      for (const file of files) {
        const filePath = file.path || file.fileName;
        if (filePath && !filePathToStatement.has(filePath)) {
          report.orphanedFiles.push({
            id: file._id.toString(),
            fileName: file.originalName || file.fileName || 'Unknown',
            path: filePath,
            statementExists: false
          });
        }
      }

      // Generate recommendations
      if (report.orphanedStatements.length > 0) {
        report.recommendations.push(
          `Found ${report.orphanedStatements.length} statements with missing files. Run cleanup to remove these orphaned records.`
        );
      }

      if (report.orphanedFiles.length > 0) {
        report.recommendations.push(
          `Found ${report.orphanedFiles.length} file records without associated statements.`
        );
      }

      if (report.orphanedStatements.length === 0 && report.orphanedFiles.length === 0) {
        report.recommendations.push('All records are properly synchronized. No action needed.');
      }

      return NextResponse.json({
        success: true,
        data: report,
        summary: {
          totalStatements: report.totalStatements,
          totalFiles: report.totalFiles,
          orphanedStatements: report.orphanedStatements.length,
          orphanedFiles: report.orphanedFiles.length,
          validRecords: report.validRecords,
          filesInSupabase: report.supabaseFiles.length
        }
      });

    } catch (error: any) {
      console.error('Error during sync verification:', error);
      report.errors.push(`Sync verification error: ${error.message}`);
      return NextResponse.json({
        success: false,
        data: report,
        error: error.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in sync endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to verify sync status', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Clean up orphaned records
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { action } = await request.json();
    
    if (!action || !['cleanup-statements', 'cleanup-files', 'cleanup-all'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: cleanup-statements, cleanup-files, or cleanup-all' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Cannot perform cleanup.' },
        { status: 500 }
      );
    }

    const results = {
      statementsRemoved: 0,
      filesRemoved: 0,
      transactionsRemoved: 0,
      errors: [] as string[]
    };

    // Clean up orphaned statements (MongoDB records without Supabase files)
    if (action === 'cleanup-statements' || action === 'cleanup-all') {
      const statements = await Statement.find({}).populate('sourceFile').lean();
      const statementIdsToDelete = [];
      const fileIdsToDelete = [];

      for (const statement of statements) {
        if (statement.sourceFile) {
          const file = statement.sourceFile as any;
          const filePath = file.path || file.fileName;
          
          if (filePath) {
            // Check if file exists in Supabase
            const { data, error } = await supabaseAdmin
              .storage
              .from(STORAGE_BUCKET)
              .download(filePath);
            
            if (error) {
              // File doesn't exist, mark for deletion
              statementIdsToDelete.push(statement._id);
              if (file._id) {
                fileIdsToDelete.push(file._id);
              }
            }
          } else {
            // No file path, mark for deletion
            statementIdsToDelete.push(statement._id);
            if (file._id) {
              fileIdsToDelete.push(file._id);
            }
          }
        } else {
          // No file reference, mark for deletion
          statementIdsToDelete.push(statement._id);
        }
      }

      if (statementIdsToDelete.length > 0) {
        // Delete transactions associated with these statements
        const { deletedCount: transactionCount } = await Transaction.deleteMany({
          statement: { $in: statementIdsToDelete }
        });
        results.transactionsRemoved = transactionCount || 0;

        // Delete the statements
        const { deletedCount: statementCount } = await Statement.deleteMany({
          _id: { $in: statementIdsToDelete }
        });
        results.statementsRemoved = statementCount || 0;

        // Delete the file records
        if (fileIdsToDelete.length > 0) {
          const { deletedCount: fileCount } = await File.deleteMany({
            _id: { $in: fileIdsToDelete }
          });
          results.filesRemoved = fileCount || 0;
        }
      }
    }

    // Clean up orphaned file records (File records without statements)
    if (action === 'cleanup-files' || action === 'cleanup-all') {
      // Get all statements with file references
      const statements = await Statement.find({}).select('sourceFile').lean();
      const usedFileIds = new Set(
        statements
          .map(s => s.sourceFile?.toString())
          .filter(id => id)
      );

      // Find orphaned files
      const allFiles = await File.find({}).lean();
      const orphanedFileIds = allFiles
        .filter(f => !usedFileIds.has(f._id.toString()))
        .map(f => f._id);

      if (orphanedFileIds.length > 0) {
        // Delete orphaned file records
        const { deletedCount } = await File.deleteMany({
          _id: { $in: orphanedFileIds }
        });
        results.filesRemoved += deletedCount || 0;

        // Optionally, try to delete the actual files from Supabase
        for (const file of allFiles.filter(f => orphanedFileIds.some(id => id.equals(f._id)))) {
          const filePath = file.path || file.fileName;
          if (filePath) {
            try {
              const { error } = await supabaseAdmin
                .storage
                .from(STORAGE_BUCKET)
                .remove([filePath]);
              
              if (error) {
                results.errors.push(`Failed to delete file from Supabase: ${filePath}`);
              }
            } catch (error) {
              results.errors.push(`Error deleting file ${filePath}: ${error}`);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      results
    });

  } catch (error: any) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to perform cleanup', details: error.message },
      { status: 500 }
    );
  }
}

// Import Transaction model for cleanup
import { Transaction } from '@/models/Transaction';