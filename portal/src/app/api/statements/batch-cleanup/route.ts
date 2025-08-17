import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { File } from '@/models/File';
import { Transaction } from '@/models/Transaction';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';

interface CleanupOptions {
  batchSize?: number;
  dryRun?: boolean;
  cleanupType?: 'all' | 'statements' | 'files';
  maxRecords?: number;
}

interface CleanupProgress {
  processed: number;
  total: number;
  deleted: {
    statements: number;
    files: number;
    transactions: number;
  };
  errors: string[];
  orphanedRecords: Array<{
    type: string;
    id: string;
    details: any;
  }>;
}

// POST: Perform batch cleanup of orphaned records
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const options: CleanupOptions = await request.json();
    const {
      batchSize = 50,
      dryRun = true,
      cleanupType = 'all',
      maxRecords = 1000
    } = options;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Cannot perform cleanup.' },
        { status: 500 }
      );
    }

    const progress: CleanupProgress = {
      processed: 0,
      total: 0,
      deleted: {
        statements: 0,
        files: 0,
        transactions: 0
      },
      errors: [],
      orphanedRecords: []
    };

    // Get all Supabase files for quick lookup
    console.log('Building Supabase file index...');
    const supabaseFiles = await buildSupabaseFileIndex();
    
    // Process statements in batches
    if (cleanupType === 'all' || cleanupType === 'statements') {
      console.log('Processing statements...');
      await processStatementsInBatches(
        supabaseFiles,
        batchSize,
        dryRun,
        maxRecords,
        progress
      );
    }

    // Process orphaned files
    if (cleanupType === 'all' || cleanupType === 'files') {
      console.log('Processing orphaned files...');
      await processOrphanedFiles(dryRun, progress);
    }

    // Generate summary
    const summary = {
      success: true,
      dryRun,
      progress,
      message: dryRun 
        ? `Dry run completed. Would delete ${progress.orphanedRecords.length} orphaned records.`
        : `Cleanup completed. Deleted ${progress.deleted.statements} statements, ${progress.deleted.files} files, and ${progress.deleted.transactions} transactions.`,
      recommendations: generateRecommendations(progress)
    };

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('Batch cleanup error:', error);
    return NextResponse.json(
      { error: 'Batch cleanup failed', details: error.message },
      { status: 500 }
    );
  }
}

// Build an index of all files in Supabase storage
async function buildSupabaseFileIndex(): Promise<Set<string>> {
  const fileIndex = new Set<string>();
  
  try {
    // List files in the statements directory structure
    const years = ['2023', '2024', '2025'];
    
    for (const year of years) {
      for (let month = 1; month <= 12; month++) {
        const path = `statements/${year}/${month}`;
        
        try {
          let offset = 0;
          let hasMore = true;
          
          while (hasMore) {
            const { data, error } = await supabaseAdmin
              .storage
              .from(STORAGE_BUCKET)
              .list(path, {
                limit: 100,
                offset
              });
            
            if (!error && data) {
              data.forEach(file => {
                if (file.name) {
                  fileIndex.add(`${path}/${file.name}`);
                }
              });
              
              hasMore = data.length === 100;
              offset += 100;
            } else {
              hasMore = false;
            }
          }
        } catch (error) {
          // Path might not exist, continue
          console.log(`Path ${path} might not exist, continuing...`);
        }
      }
    }
  } catch (error) {
    console.error('Error building Supabase file index:', error);
  }
  
  return fileIndex;
}

// Process statements in batches to avoid memory issues
async function processStatementsInBatches(
  supabaseFiles: Set<string>,
  batchSize: number,
  dryRun: boolean,
  maxRecords: number,
  progress: CleanupProgress
): Promise<void> {
  let skip = 0;
  let hasMore = true;
  
  while (hasMore && progress.processed < maxRecords) {
    // Fetch a batch of statements
    const statements = await Statement
      .find({})
      .populate('sourceFile')
      .skip(skip)
      .limit(batchSize)
      .lean();
    
    if (statements.length === 0) {
      hasMore = false;
      break;
    }
    
    const orphanedStatementIds = [];
    const orphanedFileIds = [];
    
    for (const statement of statements) {
      progress.processed++;
      
      let isOrphaned = false;
      let reason = '';
      
      if (statement.sourceFile) {
        const file = statement.sourceFile as any;
        const filePath = file.path || file.fileName;
        
        if (filePath) {
          // Check if file exists in Supabase
          if (!supabaseFiles.has(filePath)) {
            // Double-check by trying to download
            const { error } = await supabaseAdmin
              .storage
              .from(STORAGE_BUCKET)
              .download(filePath)
              .catch(() => ({ error: true }));
            
            if (error) {
              isOrphaned = true;
              reason = 'File not found in Supabase';
            }
          }
        } else {
          isOrphaned = true;
          reason = 'No file path';
        }
        
        if (isOrphaned) {
          orphanedFileIds.push(file._id);
        }
      } else {
        isOrphaned = true;
        reason = 'No file reference';
      }
      
      if (isOrphaned) {
        orphanedStatementIds.push(statement._id);
        progress.orphanedRecords.push({
          type: 'statement',
          id: statement._id.toString(),
          details: {
            accountName: statement.accountName,
            month: statement.month,
            year: statement.year,
            reason
          }
        });
      }
    }
    
    // Delete orphaned records if not in dry run mode
    if (!dryRun && orphanedStatementIds.length > 0) {
      // Delete associated transactions
      const txResult = await Transaction.deleteMany({
        statement: { $in: orphanedStatementIds }
      });
      progress.deleted.transactions += txResult.deletedCount || 0;
      
      // Delete statements
      const stmtResult = await Statement.deleteMany({
        _id: { $in: orphanedStatementIds }
      });
      progress.deleted.statements += stmtResult.deletedCount || 0;
      
      // Delete file records
      if (orphanedFileIds.length > 0) {
        const fileResult = await File.deleteMany({
          _id: { $in: orphanedFileIds }
        });
        progress.deleted.files += fileResult.deletedCount || 0;
      }
    }
    
    skip += batchSize;
    
    // Check if we've reached the limit
    if (progress.processed >= maxRecords) {
      hasMore = false;
    }
  }
  
  progress.total = await Statement.countDocuments({});
}

// Process orphaned file records
async function processOrphanedFiles(
  dryRun: boolean,
  progress: CleanupProgress
): Promise<void> {
  // Get all statements with file references
  const statements = await Statement.find({}).select('sourceFile').lean();
  const usedFileIds = new Set(
    statements
      .map(s => s.sourceFile?.toString())
      .filter(id => id)
  );
  
  // Find orphaned files in batches
  let skip = 0;
  let hasMore = true;
  const batchSize = 100;
  
  while (hasMore) {
    const files = await File
      .find({ storageProvider: 'supabase' })
      .skip(skip)
      .limit(batchSize)
      .lean();
    
    if (files.length === 0) {
      hasMore = false;
      break;
    }
    
    const orphanedFileIds = [];
    
    for (const file of files) {
      if (!usedFileIds.has(file._id.toString())) {
        orphanedFileIds.push(file._id);
        progress.orphanedRecords.push({
          type: 'file',
          id: file._id.toString(),
          details: {
            fileName: file.originalName || file.fileName,
            path: file.path || file.fileName,
            size: file.size
          }
        });
      }
    }
    
    // Delete orphaned files if not in dry run mode
    if (!dryRun && orphanedFileIds.length > 0) {
      const result = await File.deleteMany({
        _id: { $in: orphanedFileIds }
      });
      progress.deleted.files += result.deletedCount || 0;
      
      // Optionally delete from Supabase storage
      for (const fileId of orphanedFileIds) {
        const file = files.find(f => f._id.equals(fileId));
        if (file) {
          const filePath = file.path || file.fileName;
          if (filePath) {
            try {
              await supabaseAdmin
                .storage
                .from(STORAGE_BUCKET)
                .remove([filePath]);
            } catch (error) {
              progress.errors.push(`Failed to delete file from storage: ${filePath}`);
            }
          }
        }
      }
    }
    
    skip += batchSize;
  }
}

// Generate recommendations based on cleanup results
function generateRecommendations(progress: CleanupProgress): string[] {
  const recommendations = [];
  
  if (progress.orphanedRecords.length > 0) {
    recommendations.push(
      `Found ${progress.orphanedRecords.length} orphaned records that need cleanup.`
    );
    
    const statementCount = progress.orphanedRecords.filter(r => r.type === 'statement').length;
    const fileCount = progress.orphanedRecords.filter(r => r.type === 'file').length;
    
    if (statementCount > 0) {
      recommendations.push(
        `${statementCount} statements have missing or invalid file references.`
      );
    }
    
    if (fileCount > 0) {
      recommendations.push(
        `${fileCount} file records have no associated statements.`
      );
    }
    
    recommendations.push(
      'Consider running the cleanup with dryRun=false to remove these orphaned records.'
    );
  } else {
    recommendations.push('All records are properly synchronized. No cleanup needed.');
  }
  
  if (progress.errors.length > 0) {
    recommendations.push(
      `Encountered ${progress.errors.length} errors during cleanup. Review the error log.`
    );
  }
  
  // Add preventive recommendations
  recommendations.push(
    'To prevent future orphaned records:',
    '- Always delete statements through the API to ensure proper cascade deletion',
    '- Implement regular sync verification (weekly/monthly)',
    '- Add file existence checks before displaying statements in the UI'
  );
  
  return recommendations;
}

// GET: Get cleanup status and preview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Supabase is not configured',
        canPerformCleanup: false
      });
    }

    // Quick analysis
    const totalStatements = await Statement.countDocuments({});
    const totalFiles = await File.countDocuments({ storageProvider: 'supabase' });
    
    // Sample check for orphaned records
    const sampleStatements = await Statement
      .find({})
      .populate('sourceFile')
      .limit(10)
      .lean();
    
    let orphanedSample = 0;
    for (const stmt of sampleStatements) {
      if (stmt.sourceFile) {
        const file = stmt.sourceFile as any;
        const filePath = file.path || file.fileName;
        if (filePath) {
          const { error } = await supabaseAdmin
            .storage
            .from(STORAGE_BUCKET)
            .download(filePath)
            .catch(() => ({ error: true }));
          
          if (error) orphanedSample++;
        } else {
          orphanedSample++;
        }
      } else {
        orphanedSample++;
      }
    }
    
    const estimatedOrphaned = Math.round((orphanedSample / 10) * totalStatements);
    
    return NextResponse.json({
      success: true,
      canPerformCleanup: true,
      stats: {
        totalStatements,
        totalFiles,
        sampleSize: 10,
        orphanedInSample: orphanedSample,
        estimatedOrphanedRecords: estimatedOrphaned
      },
      message: estimatedOrphaned > 0 
        ? `Estimated ${estimatedOrphaned} orphaned records. Run cleanup to remove them.`
        : 'No orphaned records detected in sample. System appears to be in sync.'
    });

  } catch (error: any) {
    console.error('Error getting cleanup status:', error);
    return NextResponse.json(
      { error: 'Failed to get cleanup status', details: error.message },
      { status: 500 }
    );
  }
}