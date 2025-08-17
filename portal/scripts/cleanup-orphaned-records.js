#!/usr/bin/env node

/**
 * Batch cleanup script for orphaned statement records
 * This script removes MongoDB records where the corresponding Supabase files don't exist
 * 
 * Usage:
 *   node scripts/cleanup-orphaned-records.js --dry-run    # Preview what would be deleted
 *   node scripts/cleanup-orphaned-records.js --execute     # Actually perform the cleanup
 *   node scripts/cleanup-orphaned-records.js --verify      # Verify sync status only
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isExecute = args.includes('--execute');
const isVerify = args.includes('--verify');

if (!isDryRun && !isExecute && !isVerify) {
  console.log('Please specify an action:');
  console.log('  --dry-run   : Preview what would be deleted');
  console.log('  --execute   : Actually perform the cleanup');
  console.log('  --verify    : Check sync status only');
  process.exit(1);
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI or DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
const STORAGE_BUCKET = process.env.SUPABASE_BUCKET || 'cadgroupmgt';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Error: Supabase environment variables are not configured');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Define schemas (simplified versions for the script)
const StatementSchema = new mongoose.Schema({
  accountName: String,
  bankName: String,
  month: Number,
  year: Number,
  sourceFile: { type: mongoose.Types.ObjectId, ref: 'File' },
  status: String,
  createdAt: Date,
  updatedAt: Date
});

const FileSchema = new mongoose.Schema({
  originalName: String,
  fileName: String,
  path: String,
  storageProvider: String,
  mimeType: String,
  size: Number,
  uploadedBy: mongoose.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
});

const TransactionSchema = new mongoose.Schema({
  statement: { type: mongoose.Types.ObjectId, ref: 'Statement' },
  txnDate: Date,
  description: String,
  amount: Number,
  direction: String,
  balance: Number,
  createdAt: Date,
  updatedAt: Date
});

// Models
const Statement = mongoose.models.Statement || mongoose.model('Statement', StatementSchema);
const File = mongoose.models.File || mongoose.model('File', FileSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function checkFileExistsInSupabase(filePath) {
  try {
    const { data, error } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .download(filePath);
    
    return !error;
  } catch (error) {
    return false;
  }
}

async function listAllSupabaseFiles() {
  const allFiles = new Set();
  
  // List files in the statements directory structure
  const years = ['2023', '2024', '2025'];
  
  for (const year of years) {
    for (let month = 1; month <= 12; month++) {
      const path = `statements/${year}/${month}`;
      
      try {
        const { data, error } = await supabase
          .storage
          .from(STORAGE_BUCKET)
          .list(path, {
            limit: 1000,
            offset: 0
          });
        
        if (!error && data) {
          data.forEach(file => {
            if (file.name) {
              allFiles.add(`${path}/${file.name}`);
            }
          });
        }
      } catch (error) {
        // Path might not exist, continue
      }
    }
  }
  
  return allFiles;
}

async function performCleanup() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Get all Supabase files
    console.log('\nFetching all files from Supabase storage...');
    const supabaseFiles = await listAllSupabaseFiles();
    console.log(`Found ${supabaseFiles.size} files in Supabase storage`);

    // Get all statements with file references
    console.log('\nFetching all statements from MongoDB...');
    const statements = await Statement.find({}).populate('sourceFile').lean();
    console.log(`Found ${statements.length} statements in MongoDB`);

    // Track orphaned records
    const orphanedStatements = [];
    const orphanedFileIds = new Set();
    const validStatements = [];

    // Check each statement
    console.log('\nVerifying file existence for each statement...');
    let checkedCount = 0;
    
    for (const statement of statements) {
      checkedCount++;
      if (checkedCount % 10 === 0) {
        process.stdout.write(`\rChecked ${checkedCount}/${statements.length} statements...`);
      }

      let fileExists = false;
      
      if (statement.sourceFile) {
        const file = statement.sourceFile;
        const filePath = file.path || file.fileName;
        
        if (filePath) {
          // Check if file exists in our Supabase files set
          fileExists = supabaseFiles.has(filePath);
          
          // Double-check by trying to download
          if (!fileExists && !isDryRun) {
            fileExists = await checkFileExistsInSupabase(filePath);
          }
        }
        
        if (!fileExists) {
          orphanedStatements.push({
            id: statement._id,
            accountName: statement.accountName,
            month: statement.month,
            year: statement.year,
            fileName: file.originalName || file.fileName || 'Unknown',
            filePath: file.path || file.fileName || 'No path'
          });
          orphanedFileIds.add(file._id.toString());
        } else {
          validStatements.push(statement._id);
        }
      } else {
        // Statement has no file reference - mark as orphaned
        orphanedStatements.push({
          id: statement._id,
          accountName: statement.accountName,
          month: statement.month,
          year: statement.year,
          fileName: 'No file reference',
          filePath: 'N/A'
        });
      }
    }
    
    console.log('\n');

    // Report findings
    console.log('\n=== SYNC STATUS REPORT ===');
    console.log(`Total Statements: ${statements.length}`);
    console.log(`Valid Statements: ${validStatements.length}`);
    console.log(`Orphaned Statements: ${orphanedStatements.length}`);
    console.log(`Orphaned File Records: ${orphanedFileIds.size}`);

    if (orphanedStatements.length > 0) {
      console.log('\n=== ORPHANED STATEMENTS ===');
      orphanedStatements.slice(0, 10).forEach(stmt => {
        console.log(`  - ${stmt.accountName} (${stmt.month}/${stmt.year}): ${stmt.fileName}`);
      });
      if (orphanedStatements.length > 10) {
        console.log(`  ... and ${orphanedStatements.length - 10} more`);
      }
    }

    // Perform cleanup if requested
    if (isExecute && orphanedStatements.length > 0) {
      console.log('\n=== PERFORMING CLEANUP ===');
      
      const statementIds = orphanedStatements.map(s => s.id);
      
      // Delete associated transactions first
      console.log('Deleting associated transactions...');
      const transactionResult = await Transaction.deleteMany({
        statement: { $in: statementIds }
      });
      console.log(`Deleted ${transactionResult.deletedCount} transactions`);
      
      // Delete statements
      console.log('Deleting orphaned statements...');
      const statementResult = await Statement.deleteMany({
        _id: { $in: statementIds }
      });
      console.log(`Deleted ${statementResult.deletedCount} statements`);
      
      // Delete file records
      if (orphanedFileIds.size > 0) {
        console.log('Deleting orphaned file records...');
        const fileResult = await File.deleteMany({
          _id: { $in: Array.from(orphanedFileIds) }
        });
        console.log(`Deleted ${fileResult.deletedCount} file records`);
      }
      
      console.log('\n✅ Cleanup completed successfully!');
    } else if (isDryRun && orphanedStatements.length > 0) {
      console.log('\n=== DRY RUN MODE ===');
      console.log('No changes were made. To execute cleanup, run with --execute flag');
      console.log(`Would delete:`);
      console.log(`  - ${orphanedStatements.length} statements`);
      console.log(`  - ${orphanedFileIds.size} file records`);
      console.log(`  - Associated transactions`);
    } else if (isVerify) {
      console.log('\n=== VERIFICATION COMPLETE ===');
      if (orphanedStatements.length === 0) {
        console.log('✅ All records are properly synchronized!');
      } else {
        console.log(`⚠️ Found ${orphanedStatements.length} orphaned records`);
        console.log('Run with --dry-run to preview or --execute to clean up');
      }
    }

    // Check for orphaned files (files without statements)
    console.log('\n=== CHECKING FOR ORPHANED FILES ===');
    const allFiles = await File.find({ storageProvider: 'supabase' }).lean();
    const fileIdToStatement = new Map();
    statements.forEach(stmt => {
      if (stmt.sourceFile) {
        fileIdToStatement.set(stmt.sourceFile._id.toString(), stmt._id);
      }
    });
    
    const orphanedFiles = allFiles.filter(f => !fileIdToStatement.has(f._id.toString()));
    if (orphanedFiles.length > 0) {
      console.log(`Found ${orphanedFiles.length} file records without associated statements`);
      if (isExecute) {
        const fileIds = orphanedFiles.map(f => f._id);
        const result = await File.deleteMany({ _id: { $in: fileIds } });
        console.log(`Deleted ${result.deletedCount} orphaned file records`);
      }
    } else {
      console.log('No orphaned file records found');
    }

  } catch (error) {
    console.error('\nError during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the cleanup
performCleanup().then(() => {
  console.log('\nScript completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('\nScript failed:', error);
  process.exit(1);
});