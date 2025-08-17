#!/usr/bin/env node

// Run this after applying the SQL fix to verify deletion works
// Usage: node verify-delete-works.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { autoRefreshToken: false, persistSession: false }}
);

async function verifyDeletion() {
  console.log('🧪 Testing Supabase Deletion After Fix');
  console.log('======================================\n');

  // Create a test file
  const testFileName = `test-verify-${Date.now()}.pdf`;
  const testPath = `statements/test/${testFileName}`;
  const pdfContent = Buffer.from('%PDF-1.4\ntest');

  console.log('1. Creating test file:', testPath);
  const { error: uploadError } = await supabase.storage
    .from('cadgroupmgt')
    .upload(testPath, pdfContent, { contentType: 'application/pdf' });

  if (uploadError) {
    console.log('❌ Failed to create test file:', uploadError.message);
    return false;
  }
  console.log('✅ Test file created');

  // Delete the test file
  console.log('\n2. Deleting test file...');
  const { error: deleteError, data: deleteData } = await supabase.storage
    .from('cadgroupmgt')
    .remove([testPath]);

  if (deleteError) {
    console.log('❌ Delete failed:', deleteError.message);
    return false;
  }
  console.log('✅ Delete command executed');

  // Verify it's gone
  console.log('\n3. Verifying deletion...');
  const { error: checkError } = await supabase.storage
    .from('cadgroupmgt')
    .download(testPath);

  if (checkError && checkError.message.includes('not found')) {
    console.log('✅ SUCCESS! File was deleted properly!');
    console.log('\n🎉 Your deletion issue is FIXED!');
    console.log('Deploy these changes to production and deletion will work.');
    return true;
  } else {
    console.log('❌ FAILED! File still exists after deletion.');
    console.log('\n⚠️  You need to run the SQL fix in Supabase:');
    console.log('1. Go to https://app.supabase.com/project/cpoeuapfcbwymoftfmsf/sql/new');
    console.log('2. Run the contents of FIX_DELETE_NOW.sql');
    console.log('3. Run this script again to verify');
    return false;
  }
}

verifyDeletion().catch(console.error);