#!/usr/bin/env node

/**
 * Script to clean up orphaned files in Supabase storage
 * This helps identify files that exist in Supabase but not in the database
 * Run with: node scripts/cleanup-supabase-files.js [--dry-run]
 */

const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;
const bucket = process.env.SUPABASE_BUCKET || 'cadgroup-uploads';

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required environment variables:');
  console.error('  - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function listAllFiles(path = '', allFiles = []) {
  const { data: files, error } = await supabase
    .storage
    .from(bucket)
    .list(path, {
      limit: 1000,
      offset: 0
    });

  if (error) {
    console.error(`Error listing files in ${path}:`, error);
    return allFiles;
  }

  for (const file of files || []) {
    const fullPath = path ? `${path}/${file.name}` : file.name;
    
    if (file.metadata && file.metadata.size) {
      // It's a file
      allFiles.push({
        path: fullPath,
        size: file.metadata.size,
        lastModified: file.metadata.lastModified || file.updated_at
      });
    } else {
      // It's a folder, recursively list its contents
      await listAllFiles(fullPath, allFiles);
    }
  }

  return allFiles;
}

async function cleanupOrphanedFiles() {
  console.log('🧹 Supabase Storage Cleanup Tool');
  console.log('=================================');
  console.log(`📦 Bucket: ${bucket}`);
  console.log(`🌐 URL: ${supabaseUrl}`);
  console.log(`🔍 Mode: ${isDryRun ? 'DRY RUN (no files will be deleted)' : 'LIVE (files will be deleted)'}`);
  console.log('');

  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import models after connection
    const File = require('../src/models/File').File;

    // 1. List all files in Supabase
    console.log('📋 Listing all files in Supabase storage...');
    const supabaseFiles = await listAllFiles('statements');
    console.log(`✅ Found ${supabaseFiles.length} files in Supabase\n`);

    // 2. Get all file paths from database
    console.log('📋 Getting all file records from database...');
    const dbFiles = await File.find({ 
      storageProvider: 'supabase',
      path: { $exists: true, $ne: null }
    }).select('path originalName size createdAt');
    console.log(`✅ Found ${dbFiles.length} file records in database\n`);

    // Create a Set of database file paths for quick lookup
    const dbFilePaths = new Set(dbFiles.map(f => f.path));

    // 3. Find orphaned files (in Supabase but not in database)
    console.log('🔍 Identifying orphaned files...');
    const orphanedFiles = supabaseFiles.filter(file => !dbFilePaths.has(file.path));
    
    if (orphanedFiles.length === 0) {
      console.log('✅ No orphaned files found! Storage is clean.\n');
    } else {
      console.log(`⚠️  Found ${orphanedFiles.length} orphaned files in Supabase:\n`);
      
      let totalSize = 0;
      orphanedFiles.forEach(file => {
        console.log(`  - ${file.path}`);
        console.log(`    Size: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`    Last Modified: ${new Date(file.lastModified).toLocaleString()}`);
        totalSize += file.size;
      });
      
      console.log(`\n📊 Total size of orphaned files: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

      if (!isDryRun) {
        console.log('\n🗑️  Deleting orphaned files...');
        
        let deletedCount = 0;
        let failedCount = 0;
        
        for (const file of orphanedFiles) {
          const { error } = await supabase
            .storage
            .from(bucket)
            .remove([file.path]);
          
          if (error) {
            console.error(`  ❌ Failed to delete ${file.path}: ${error.message}`);
            failedCount++;
          } else {
            console.log(`  ✅ Deleted ${file.path}`);
            deletedCount++;
          }
        }
        
        console.log(`\n✨ Cleanup complete!`);
        console.log(`  - Deleted: ${deletedCount} files`);
        console.log(`  - Failed: ${failedCount} files`);
        console.log(`  - Freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      } else {
        console.log('\n💡 This was a DRY RUN. No files were deleted.');
        console.log('   To actually delete these files, run without --dry-run flag:');
        console.log('   node scripts/cleanup-supabase-files.js');
      }
    }

    // 4. Find missing files (in database but not in Supabase)
    console.log('\n🔍 Checking for missing files (in database but not in Supabase)...');
    const supabaseFilePaths = new Set(supabaseFiles.map(f => f.path));
    const missingFiles = dbFiles.filter(file => !supabaseFilePaths.has(file.path));
    
    if (missingFiles.length > 0) {
      console.log(`⚠️  Found ${missingFiles.length} database records with missing files:\n`);
      missingFiles.forEach(file => {
        console.log(`  - ${file.originalName}`);
        console.log(`    Path: ${file.path}`);
        console.log(`    Created: ${file.createdAt.toLocaleString()}`);
      });
      
      if (!isDryRun) {
        console.log('\n💡 Consider cleaning up these database records.');
        console.log('   You can use the admin cleanup endpoint or run a database cleanup script.');
      }
    } else {
      console.log('✅ All database file records have corresponding files in Supabase.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupOrphanedFiles().catch(console.error);