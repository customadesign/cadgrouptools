#!/usr/bin/env node

/**
 * Script to clean up orphaned files in Supabase storage
 * Files that exist in Supabase but don't have corresponding database records
 * Run with: node scripts/cleanup-orphaned-files.js [--dry-run]
 */

const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Parse command line arguments
const isDryRun = process.argv.includes('--dry-run');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;
const bucket = process.env.SUPABASE_BUCKET || 'cadgroup-uploads';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('❌ Missing MongoDB URI');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// File model schema
const FileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  uploadedBy: mongoose.Types.ObjectId,
  storageProvider: String,
  url: String,
  bucket: String,
  path: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

async function cleanupOrphanedFiles() {
  console.log('🧹 Cleanup Orphaned Files in Supabase Storage');
  console.log('=============================================');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no files will be deleted)' : 'LIVE (files will be deleted)'}`);
  console.log(`📦 Bucket: ${bucket}`);
  console.log('');

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const File = mongoose.models.File || mongoose.model('File', FileSchema);

    // Get all file paths from database
    console.log('\n📊 Loading file records from database...');
    const dbFiles = await File.find({ 
      storageProvider: 'supabase',
      path: { $exists: true, $ne: null }
    }).select('path').lean();
    
    const dbFilePaths = new Set(dbFiles.map(f => f.path));
    console.log(`✅ Found ${dbFilePaths.size} files in database`);

    // List all files in Supabase storage
    console.log('\n📋 Listing files in Supabase storage...');
    const orphanedFiles = [];
    
    async function listFilesRecursive(path = '') {
      const { data: items, error } = await supabase
        .storage
        .from(bucket)
        .list(path, {
          limit: 1000
        });

      if (error) {
        console.error(`❌ Error listing files in ${path}:`, error);
        return;
      }

      if (!items) return;

      for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        
        if (item.metadata && item.metadata.size) {
          // It's a file
          if (!dbFilePaths.has(fullPath)) {
            orphanedFiles.push({
              path: fullPath,
              size: item.metadata.size,
              lastModified: item.updated_at
            });
          }
        } else {
          // It's a folder, recurse into it
          await listFilesRecursive(fullPath);
        }
      }
    }

    await listFilesRecursive('statements');
    
    console.log(`\n🔍 Found ${orphanedFiles.length} orphaned files in Supabase`);

    if (orphanedFiles.length === 0) {
      console.log('✨ No orphaned files found. Storage is clean!');
      await mongoose.disconnect();
      return;
    }

    // Display orphaned files
    console.log('\n📄 Orphaned files:');
    let totalSize = 0;
    orphanedFiles.forEach((file, index) => {
      if (index < 10) {
        console.log(`  ${index + 1}. ${file.path} (${formatFileSize(file.size)})`);
      }
      totalSize += file.size;
    });
    
    if (orphanedFiles.length > 10) {
      console.log(`  ... and ${orphanedFiles.length - 10} more files`);
    }
    
    console.log(`\n📊 Total size of orphaned files: ${formatFileSize(totalSize)}`);

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN MODE: No files were deleted');
      console.log('Run without --dry-run flag to actually delete orphaned files');
    } else {
      // Confirm deletion
      console.log('\n⚠️  WARNING: This will permanently delete orphaned files from Supabase');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('\n🗑️  Deleting orphaned files...');
      
      // Delete files in batches
      const batchSize = 50;
      let deleted = 0;
      let failed = 0;
      
      for (let i = 0; i < orphanedFiles.length; i += batchSize) {
        const batch = orphanedFiles.slice(i, i + batchSize).map(f => f.path);
        
        const { error } = await supabase
          .storage
          .from(bucket)
          .remove(batch);
        
        if (error) {
          console.error(`❌ Error deleting batch:`, error);
          failed += batch.length;
        } else {
          deleted += batch.length;
          console.log(`✅ Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(orphanedFiles.length/batchSize)} (${deleted} files)`);
        }
      }
      
      console.log(`\n✅ Cleanup complete: ${deleted} files deleted, ${failed} failed`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Run the cleanup
cleanupOrphanedFiles().catch(console.error);