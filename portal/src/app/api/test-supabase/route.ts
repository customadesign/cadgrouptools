import { NextRequest, NextResponse } from 'next/server';
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

// POST method for testing actual file uploads
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: 'Storage service not configured',
          details: {
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
            SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || STORAGE_BUCKET,
          }
        },
        { status: 503 }
      );
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate test filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `test/test-upload-${timestamp}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      return NextResponse.json(
        { 
          error: `Upload failed: ${error.message}`,
          details: {
            bucket: STORAGE_BUCKET,
            fileName,
            fileSize: file.size,
            fileType: file.type,
            errorDetails: error
          }
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    // Try to clean up the test file
    const { error: deleteError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);

    return NextResponse.json({
      success: true,
      message: 'Test upload successful',
      publicUrl: publicUrlData.publicUrl,
      fileName,
      bucket: STORAGE_BUCKET,
      cleaned: !deleteError,
      cleanupError: deleteError?.message
    });

  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json(
      { 
        error: 'Test upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}