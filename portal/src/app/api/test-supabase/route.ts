import { NextResponse } from 'next/server';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';

export async function GET() {
  // Check environment variables
  const envCheck = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
    SUPABASE_BUCKET: !!process.env.SUPABASE_BUCKET,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  // Check if Supabase client was created
  const clientCreated = !!supabaseAdmin;

  // Try to list buckets if client exists
  let bucketsStatus = 'not attempted';
  let bucketExists = false;
  let bucketDetails = null;

  if (supabaseAdmin) {
    try {
      const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
      
      if (error) {
        bucketsStatus = `error: ${error.message}`;
      } else {
        bucketsStatus = `found ${buckets?.length || 0} buckets`;
        
        // Check if our specific bucket exists
        if (buckets && buckets.length > 0) {
          const ourBucket = buckets.find(b => b.name === STORAGE_BUCKET);
          if (ourBucket) {
            bucketExists = true;
            bucketDetails = {
              name: ourBucket.name,
              public: ourBucket.public,
              created_at: ourBucket.created_at,
              updated_at: ourBucket.updated_at,
            };
          }
        }
      }
    } catch (error) {
      bucketsStatus = `exception: ${error instanceof Error ? error.message : 'unknown'}`;
    }
  }

  // Try to test upload permissions if bucket exists
  let uploadTestStatus = 'not attempted';
  if (supabaseAdmin && bucketExists) {
    try {
      const testFileName = `test/test-${Date.now()}.txt`;
      const testContent = 'Test upload from API';
      
      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(testFileName, Buffer.from(testContent), {
          contentType: 'text/plain',
          upsert: true,
        });

      if (error) {
        uploadTestStatus = `upload error: ${error.message}`;
      } else {
        uploadTestStatus = 'upload successful';
        
        // Try to delete the test file
        const { error: deleteError } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .remove([testFileName]);
          
        if (deleteError) {
          uploadTestStatus += ` (cleanup failed: ${deleteError.message})`;
        } else {
          uploadTestStatus += ' (cleanup successful)';
        }
      }
    } catch (error) {
      uploadTestStatus = `exception: ${error instanceof Error ? error.message : 'unknown'}`;
    }
  }

  return NextResponse.json({
    envVariables: envCheck,
    allEnvConfigured: Object.values(envCheck).every(v => v === true),
    supabaseClient: clientCreated ? 'created' : 'not created',
    bucketName: STORAGE_BUCKET,
    bucketsStatus,
    targetBucketExists: bucketExists,
    bucketDetails,
    uploadTestStatus,
    debug: {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET (hidden)' : 'NOT SET',
      SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || STORAGE_BUCKET,
    }
  });
}