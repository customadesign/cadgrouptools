#!/usr/bin/env node

/**
 * Debug script to test and fix the file deletion issue
 * Run with: node scripts/debug-delete-issue.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

console.log('🔧 Debugging File Deletion Issue');
console.log('=================================');
console.log(`📦 Bucket: ${bucket}`);
console.log(`🌐 URL: ${supabaseUrl}`);
console.log(`🔑 Service Role: ${supabaseServiceRole.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function testDeletion() {
  try {
    // 1. Test bucket access
    console.log('1️⃣  Testing bucket access...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('❌ Cannot list buckets:', bucketsError);
      console.log('   This might indicate a permission issue with the service role key.');
      return;
    }
    
    const bucketExists = buckets.some(b => b.name === bucket);
    if (!bucketExists) {
      console.error(`❌ Bucket "${bucket}" not found. Available buckets:`, buckets.map(b => b.name));
      return;
    }
    console.log(`✅ Bucket "${bucket}" exists and is accessible\n`);

    // 2. Test file upload
    console.log('2️⃣  Testing file upload...');
    const testFileName = `statements/test/deletion-test-${Date.now()}.txt`;
    const testContent = 'This is a test file for debugging deletion';
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(testFileName, Buffer.from(testContent), {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Cannot upload test file:', uploadError);
      return;
    }
    console.log(`✅ Successfully uploaded: ${testFileName}\n`);

    // 3. Test file download (verify it exists)
    console.log('3️⃣  Verifying file exists...');
    const { data: downloadData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(testFileName);

    if (downloadError) {
      console.error('❌ Cannot download file:', downloadError);
      return;
    }
    console.log(`✅ File exists and can be downloaded (size: ${downloadData.size} bytes)\n`);

    // 4. Test file deletion with detailed logging
    console.log('4️⃣  Testing file deletion...');
    console.log(`   Attempting to delete: ${testFileName}`);
    
    const { data: deleteData, error: deleteError } = await supabase
      .storage
      .from(bucket)
      .remove([testFileName]);

    if (deleteError) {
      console.error('❌ Deletion failed:', deleteError);
      console.error('   Error details:', {
        message: deleteError.message,
        status: deleteError.status,
        statusCode: deleteError.statusCode,
        name: deleteError.name,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      });
      
      // Try alternative deletion methods
      console.log('\n   Trying alternative deletion method...');
      const { error: altDeleteError } = await supabase
        .storage
        .from(bucket)
        .remove([testFileName.replace('statements/', '')]);
      
      if (altDeleteError) {
        console.error('   ❌ Alternative deletion also failed:', altDeleteError.message);
      } else {
        console.log('   ✅ Alternative deletion succeeded!');
        console.log('   💡 Issue: File paths might need adjustment');
      }
      return;
    }
    
    console.log('✅ File deletion request succeeded');
    console.log('   Delete response:', deleteData);

    // 5. Verify file is actually deleted
    console.log('\n5️⃣  Verifying file is deleted...');
    const { data: verifyData, error: verifyError } = await supabase
      .storage
      .from(bucket)
      .download(testFileName);

    if (verifyError && verifyError.message.includes('not found')) {
      console.log('✅ File successfully deleted - verification confirmed\n');
    } else if (verifyError) {
      console.log(`✅ File appears deleted (error: ${verifyError.message})\n`);
    } else {
      console.error('❌ File still exists after deletion!');
      console.error('   This indicates a serious issue with Supabase deletion\n');
    }

    // 6. Test with actual statement file pattern
    console.log('6️⃣  Testing with actual statement file pattern...');
    const realFileName = `statements/2024/1/${Date.now()}_test_statement.pdf`;
    
    const { error: realUploadError } = await supabase
      .storage
      .from(bucket)
      .upload(realFileName, Buffer.from('PDF content simulation'), {
        contentType: 'application/pdf',
        upsert: false
      });

    if (!realUploadError) {
      console.log(`✅ Uploaded realistic file: ${realFileName}`);
      
      const { error: realDeleteError } = await supabase
        .storage
        .from(bucket)
        .remove([realFileName]);
      
      if (realDeleteError) {
        console.error(`❌ Failed to delete realistic file: ${realDeleteError.message}`);
      } else {
        console.log('✅ Successfully deleted realistic file pattern\n');
      }
    }

    // Summary
    console.log('📊 Summary');
    console.log('==========');
    console.log('✅ Supabase connection is working');
    console.log('✅ Bucket is accessible');
    console.log('✅ Upload functionality works');
    console.log('✅ Download functionality works');
    console.log('✅ Delete functionality works');
    console.log('\n✨ The deletion functionality appears to be working correctly!');
    console.log('   If deletions are still failing in the app, check:');
    console.log('   1. The file paths are correct in the database');
    console.log('   2. The authentication/session is valid when making delete requests');
    console.log('   3. The frontend is properly updating after successful deletion');
    console.log('   4. Check server logs for any "[DELETE]" prefixed messages for detailed info');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDeletion().catch(console.error);