#!/usr/bin/env node

/**
 * Test script to diagnose and fix statement deletion issues
 * Run with: node scripts/test-statement-deletion.js [statementId]
 */

const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get statement ID from command line
const statementId = process.argv[2];

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

async function testStatementDeletion() {
  console.log('🔍 Testing Statement Deletion');
  console.log('==============================');
  console.log(`📦 Bucket: ${bucket}`);
  console.log(`🌐 URL: ${supabaseUrl}`);
  console.log('');

  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models after connection
    const Statement = require('../src/models/Statement').Statement;
    const File = require('../src/models/File').File;
    const Transaction = require('../src/models/Transaction').Transaction;

    if (statementId) {
      // Test deletion of specific statement
      console.log(`\n📄 Testing deletion of statement: ${statementId}`);
      
      // Find the statement
      const statement = await Statement.findById(statementId).populate('sourceFile');
      
      if (!statement) {
        console.error('❌ Statement not found');
        return;
      }

      console.log('✅ Statement found:');
      console.log(`  - Account: ${statement.accountName}`);
      console.log(`  - Period: ${statement.month}/${statement.year}`);
      console.log(`  - Status: ${statement.status}`);

      if (statement.sourceFile) {
        const fileDoc = statement.sourceFile;
        console.log('\n📁 Associated file:');
        console.log(`  - Original name: ${fileDoc.originalName}`);
        console.log(`  - Path: ${fileDoc.path}`);
        console.log(`  - Storage: ${fileDoc.storageProvider}`);
        console.log(`  - Bucket: ${fileDoc.bucket}`);

        // Check if file exists in Supabase
        if (fileDoc.storageProvider === 'supabase' && fileDoc.path) {
          console.log('\n🔍 Checking if file exists in Supabase...');
          
          // Try to download the file to verify it exists
          const { data: downloadData, error: downloadError } = await supabase
            .storage
            .from(bucket)
            .download(fileDoc.path);

          if (downloadError) {
            console.log(`⚠️  File not found in Supabase: ${downloadError.message}`);
            console.log('   This might be why deletion appears to fail (file already deleted)');
          } else {
            console.log(`✅ File exists in Supabase (size: ${downloadData.size} bytes)`);
            
            // Try to delete the file
            console.log('\n🗑️  Attempting to delete file from Supabase...');
            const { error: deleteError } = await supabase
              .storage
              .from(bucket)
              .remove([fileDoc.path]);

            if (deleteError) {
              console.error(`❌ Failed to delete file: ${deleteError.message}`);
              console.error('   Full error:', deleteError);
            } else {
              console.log('✅ File deleted from Supabase successfully');
              
              // Verify deletion
              const { data: verifyData, error: verifyError } = await supabase
                .storage
                .from(bucket)
                .download(fileDoc.path);
              
              if (verifyError && verifyError.message.includes('not found')) {
                console.log('✅ Deletion verified - file no longer exists');
              } else {
                console.log('⚠️  File may still exist after deletion attempt');
              }
            }
          }
        }
      } else {
        console.log('⚠️  No file associated with this statement');
      }

      // Count associated transactions
      const transactionCount = await Transaction.countDocuments({ statement: statement._id });
      console.log(`\n💰 Found ${transactionCount} associated transactions`);

    } else {
      // List recent statements for testing
      console.log('\n📋 Recent statements (use ID to test specific deletion):');
      const statements = await Statement.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('sourceFile');

      for (const stmt of statements) {
        console.log(`\n  ID: ${stmt._id}`);
        console.log(`  Account: ${stmt.accountName}`);
        console.log(`  Period: ${stmt.month}/${stmt.year}`);
        console.log(`  Status: ${stmt.status}`);
        if (stmt.sourceFile) {
          console.log(`  File: ${stmt.sourceFile.originalName}`);
          console.log(`  Path: ${stmt.sourceFile.path}`);
        }
      }

      console.log('\n💡 To test deletion, run:');
      console.log('   node scripts/test-statement-deletion.js <statementId>');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testStatementDeletion().catch(console.error);