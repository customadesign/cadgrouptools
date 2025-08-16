import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test Supabase configuration
    const tests = {
      supabaseConfigured: false,
      bucketExists: false,
      canList: false,
      canUpload: false,
      canDelete: false,
      bucketName: STORAGE_BUCKET,
      errors: [] as string[],
    };

    // Check if Supabase is configured
    if (!supabaseAdmin) {
      tests.errors.push('Supabase Admin client is not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables.');
      return NextResponse.json({
        success: false,
        tests,
        message: 'Supabase is not configured',
      }, { status: 500 });
    }

    tests.supabaseConfigured = true;

    // Test 1: Check if bucket exists and can list files
    try {
      const { data: files, error: listError } = await supabaseAdmin
        .storage
        .from(STORAGE_BUCKET)
        .list('statements', { limit: 1 });

      if (listError) {
        tests.errors.push(`Cannot list files: ${listError.message}`);
      } else {
        tests.canList = true;
        tests.bucketExists = true;
      }
    } catch (error: any) {
      tests.errors.push(`List test failed: ${error.message}`);
    }

    // Test 2: Try to upload a test file
    if (tests.bucketExists) {
      try {
        const testFileName = `test/storage-test-${Date.now()}.txt`;
        const testContent = `Storage test at ${new Date().toISOString()}`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from(STORAGE_BUCKET)
          .upload(testFileName, Buffer.from(testContent), {
            contentType: 'text/plain',
            upsert: false,
          });

        if (uploadError) {
          tests.errors.push(`Cannot upload: ${uploadError.message}`);
        } else {
          tests.canUpload = true;

          // Test 3: Try to delete the test file
          const { error: deleteError } = await supabaseAdmin
            .storage
            .from(STORAGE_BUCKET)
            .remove([testFileName]);

          if (deleteError) {
            tests.errors.push(`Cannot delete: ${deleteError.message}`);
          } else {
            tests.canDelete = true;
          }
        }
      } catch (error: any) {
        tests.errors.push(`Upload/Delete test failed: ${error.message}`);
      }
    }

    // Determine overall status
    const allTestsPassed = tests.supabaseConfigured && 
                          tests.bucketExists && 
                          tests.canList && 
                          tests.canUpload && 
                          tests.canDelete;

    return NextResponse.json({
      success: allTestsPassed,
      tests,
      message: allTestsPassed 
        ? 'All storage tests passed successfully!' 
        : 'Some storage tests failed. Check the tests object for details.',
      recommendations: tests.errors.length > 0 ? [
        'Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE are set correctly',
        `Verify the bucket "${STORAGE_BUCKET}" exists in your Supabase project`,
        'Check that the service role key has proper permissions',
        'Verify RLS policies allow service role operations',
      ] : [],
    });

  } catch (error: any) {
    console.error('Storage test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Storage test failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}