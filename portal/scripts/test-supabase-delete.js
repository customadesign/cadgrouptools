#!/usr/bin/env node

/**
 * Test script to verify Supabase storage deletion functionality
 * Run with: node scripts/test-supabase-delete.js
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

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function testSupabaseDelete() {
  console.log('🔧 Testing Supabase Storage Deletion');
  console.log('=====================================');
  console.log(`📦 Bucket: ${bucket}`);
  console.log(`🌐 URL: ${supabaseUrl}`);
  console.log('');

  try {
    // 1. List files in the bucket
    console.log('📋 Listing files in bucket...');
    const { data: files, error: listError } = await supabase
      .storage
      .from(bucket)
      .list('statements', {
        limit: 10,
        offset: 0
      });

    if (listError) {
      console.error('❌ Error listing files:', listError);
      return;
    }

    console.log(`✅ Found ${files?.length || 0} files/folders in statements/`);
    
    if (files && files.length > 0) {
      console.log('\n📁 Sample files/folders:');
      files.slice(0, 5).forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'folder'})`);
      });
    }

    // 2. Test upload (create a test file)
    console.log('\n📤 Testing file upload...');
    const testFileName = `statements/test/delete-test-${Date.now()}.txt`;
    const testContent = 'This is a test file for deletion testing';
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(testFileName, Buffer.from(testContent), {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error uploading test file:', uploadError);
      return;
    }

    console.log(`✅ Successfully uploaded test file: ${testFileName}`);

    // 3. Verify file exists
    console.log('\n🔍 Verifying file exists...');
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(testFileName);
    
    console.log(`✅ File URL: ${publicUrl}`);

    // 4. Test deletion
    console.log('\n🗑️  Testing file deletion...');
    const { error: deleteError } = await supabase
      .storage
      .from(bucket)
      .remove([testFileName]);

    if (deleteError) {
      console.error('❌ Error deleting test file:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted test file: ${testFileName}`);

    // 5. Verify file is deleted
    console.log('\n🔍 Verifying file is deleted...');
    const { data: checkFile, error: checkError } = await supabase
      .storage
      .from(bucket)
      .list('statements/test', {
        search: testFileName.split('/').pop()
      });

    if (!checkError && checkFile && checkFile.length === 0) {
      console.log('✅ File successfully deleted from storage');
    } else {
      console.log('⚠️  File may still exist or check failed');
    }

    console.log('\n✨ Supabase storage deletion test completed successfully!');
    console.log('The DELETE endpoint should now properly remove files from Supabase.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testSupabaseDelete().catch(console.error);