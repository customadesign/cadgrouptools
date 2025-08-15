#!/usr/bin/env node

/**
 * Script to check Supabase configuration and bucket setup
 * Run with: node scripts/check-supabase.js
 */

require('dotenv').config({ path: '.env.local' });

async function checkSupabase() {
  console.log('=== Supabase Configuration Check ===\n');

  // Check environment variables
  console.log('1. Environment Variables:');
  const envVars = {
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE': process.env.SUPABASE_SERVICE_ROLE,
    'SUPABASE_BUCKET': process.env.SUPABASE_BUCKET,
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  let allConfigured = true;
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      console.log(`   ✓ ${key}: ${key.includes('KEY') || key.includes('ROLE') ? '[HIDDEN]' : value}`);
    } else {
      console.log(`   ✗ ${key}: NOT SET`);
      allConfigured = false;
    }
  }

  if (!allConfigured) {
    console.log('\n❌ Missing environment variables. Please configure them in .env.local or Render dashboard.');
    process.exit(1);
  }

  console.log('\n2. Testing Supabase Client:');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    console.log('   ✓ Supabase client created successfully');

    console.log('\n3. Checking Storage Buckets:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log(`   ✗ Error listing buckets: ${bucketsError.message}`);
      process.exit(1);
    }

    console.log(`   ✓ Found ${buckets.length} bucket(s)`);
    
    const targetBucket = process.env.SUPABASE_BUCKET || 'cadgroup-uploads';
    const bucket = buckets.find(b => b.name === targetBucket);

    if (bucket) {
      console.log(`   ✓ Target bucket '${targetBucket}' exists`);
      console.log(`     - Public: ${bucket.public}`);
      console.log(`     - Created: ${bucket.created_at}`);
      
      if (!bucket.public) {
        console.log(`   ⚠️  Warning: Bucket is not public. Avatar URLs may not be accessible.`);
      }
    } else {
      console.log(`   ✗ Target bucket '${targetBucket}' does not exist`);
      console.log('   Available buckets:');
      buckets.forEach(b => {
        console.log(`     - ${b.name} (public: ${b.public})`);
      });
    }

    if (bucket) {
      console.log('\n4. Testing Upload Permissions:');
      const testFile = `test/test-${Date.now()}.txt`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(testFile, Buffer.from('Test upload'), {
          contentType: 'text/plain',
        });

      if (uploadError) {
        console.log(`   ✗ Upload test failed: ${uploadError.message}`);
      } else {
        console.log('   ✓ Upload test successful');
        
        // Try to get public URL
        const { data: urlData } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(testFile);
        
        console.log(`   ✓ Public URL generated: ${urlData.publicUrl.substring(0, 50)}...`);

        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from(targetBucket)
          .remove([testFile]);
        
        if (!deleteError) {
          console.log('   ✓ Test file cleaned up');
        }
      }
    }

    console.log('\n✅ Supabase configuration looks good!');
    
    if (!bucket) {
      console.log('\n📝 Next steps:');
      console.log(`1. Create a bucket named '${targetBucket}' in Supabase Storage`);
      console.log('2. Set the bucket to PUBLIC');
      console.log('3. Configure bucket policies for upload/read access');
    }

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

checkSupabase().catch(console.error);