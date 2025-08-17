#!/usr/bin/env node

// Test deletion using direct API calls
require('dotenv').config({ path: '.env.local' });

async function testDirectAPI() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE;
  
  console.log('Testing direct Supabase API deletion...\n');
  
  // Create a test file first
  const testFile = `test-api-${Date.now()}.pdf`;
  const testPath = `statements/test/${testFile}`;
  const pdfContent = Buffer.from('%PDF-1.4\ntest');
  
  console.log('1. Creating test file via API...');
  const uploadResponse = await fetch(
    `${SUPABASE_URL}/storage/v1/object/cadgroupmgt/${testPath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/pdf',
      },
      body: pdfContent,
    }
  );
  
  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    console.log('❌ Upload failed:', error);
    return;
  }
  console.log('✅ File uploaded');
  
  // Now try to delete it using the API directly
  console.log('\n2. Deleting via direct API call...');
  const deleteResponse = await fetch(
    `${SUPABASE_URL}/storage/v1/object/cadgroupmgt/${testPath}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  
  console.log('Delete response status:', deleteResponse.status);
  const deleteResult = await deleteResponse.text();
  console.log('Delete response:', deleteResult);
  
  // Check if file still exists
  console.log('\n3. Checking if file exists...');
  const checkResponse = await fetch(
    `${SUPABASE_URL}/storage/v1/object/cadgroupmgt/${testPath}`,
    {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  
  if (checkResponse.status === 404) {
    console.log('✅ SUCCESS! File was deleted!');
  } else if (checkResponse.status === 200) {
    console.log('❌ File still exists after deletion');
  } else {
    console.log('Status:', checkResponse.status);
  }
}

testDirectAPI().catch(console.error);