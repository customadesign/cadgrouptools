#!/usr/bin/env node

// Diagnostic script to test Supabase deletion
// Run with: node diagnose-delete.js

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function diagnoseSupabase() {
  console.log('🔍 Supabase Delete Diagnostic Tool');
  console.log('===================================\n');

  // Check environment variables
  console.log('1. Environment Variables Check:');
  console.log('-------------------------------');
  
  const envVars = {
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
    SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || 'cadgroupmgt',
  };

  let allSet = true;
  for (const [key, value] of Object.entries(envVars)) {
    if (!value || value.includes('placeholder')) {
      console.log(`❌ ${key}: NOT SET or PLACEHOLDER`);
      allSet = false;
    } else {
      console.log(`✅ ${key}: ${key.includes('ROLE') ? '[HIDDEN]' : value}`);
    }
  }

  if (!allSet) {
    console.log('\n⚠️  Missing environment variables. Please set them in .env.local');
    return;
  }

  // Initialize Supabase client
  console.log('\n2. Initializing Supabase Client:');
  console.log('---------------------------------');
  
  let supabase;
  try {
    supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    console.log('✅ Supabase client initialized');
  } catch (error) {
    console.log('❌ Failed to initialize:', error.message);
    return;
  }

  // Test bucket access
  console.log('\n3. Testing Bucket Access:');
  console.log('-------------------------');
  
  const bucket = envVars.SUPABASE_BUCKET;
  console.log(`Testing bucket: ${bucket}`);

  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Cannot list buckets:', bucketsError.message);
    } else {
      const bucketExists = buckets.some(b => b.name === bucket);
      if (bucketExists) {
        console.log(`✅ Bucket "${bucket}" exists`);
      } else {
        console.log(`❌ Bucket "${bucket}" NOT FOUND`);
        console.log('Available buckets:', buckets.map(b => b.name).join(', '));
      }
    }
  } catch (error) {
    console.log('❌ Error checking buckets:', error.message);
  }

  // List files in bucket
  console.log('\n4. Listing Files in Bucket:');
  console.log('----------------------------');
  
  try {
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('statements', { limit: 5 });
    
    if (listError) {
      console.log('❌ Cannot list files:', listError.message);
    } else {
      console.log(`✅ Found ${files?.length || 0} files in statements/`);
      if (files && files.length > 0) {
        console.log('Sample files:', files.slice(0, 3).map(f => f.name).join(', '));
      }
    }
  } catch (error) {
    console.log('❌ Error listing files:', error.message);
  }

  // Test file operations
  console.log('\n5. Testing File Operations:');
  console.log('----------------------------');
  
  const testFileName = `test-delete-${Date.now()}.pdf`;
  // Create a minimal PDF buffer
  const testContent = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n203\n%%EOF');
  
  // Create test file
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(testFileName, testContent, {
        contentType: 'application/pdf',
      });
    
    if (uploadError) {
      console.log('❌ Cannot create test file:', uploadError.message);
      return;
    } else {
      console.log('✅ Test file created:', testFileName);
    }
  } catch (error) {
    console.log('❌ Error creating file:', error.message);
    return;
  }

  // Delete test file
  try {
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([testFileName]);
    
    if (deleteError) {
      console.log('❌ Cannot delete test file:', deleteError.message);
      console.log('   This is likely a permissions issue with the service role key');
    } else {
      console.log('✅ Test file deleted successfully');
      
      // Verify deletion
      const { data: checkData, error: checkError } = await supabase.storage
        .from(bucket)
        .download(testFileName);
      
      if (checkError && checkError.message.includes('not found')) {
        console.log('✅ Deletion verified - file is gone');
      } else {
        console.log('⚠️  File may still exist after deletion');
      }
    }
  } catch (error) {
    console.log('❌ Error during delete test:', error.message);
  }

  // Summary
  console.log('\n6. Summary:');
  console.log('-----------');
  console.log('If all tests passed, deletion should work.');
  console.log('If deletion test failed, check:');
  console.log('  1. Service role key has delete permissions');
  console.log('  2. Bucket policies allow deletion');
  console.log('  3. The bucket name matches your Supabase project');
}

// Run diagnosis
diagnoseSupabase().catch(console.error);