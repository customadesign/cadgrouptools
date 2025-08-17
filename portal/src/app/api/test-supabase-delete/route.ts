import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin, STORAGE_BUCKET, SUPABASE_STATUS } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testFilePath } = await request.json();

    // Comprehensive Supabase configuration check
    const configCheck = {
      supabaseStatus: SUPABASE_STATUS,
      bucket: STORAGE_BUCKET,
      envVars: {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
        SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE ? 'SET' : 'NOT SET',
        SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || 'NOT SET',
      },
      hasAdmin: !!supabaseAdmin,
    };

    if (!supabaseAdmin) {
      return NextResponse.json({
        error: 'Supabase admin client not initialized',
        configCheck,
      }, { status: 500 });
    }

    const results = {
      configCheck,
      tests: {} as any,
    };

    // Test 1: List files in bucket
    try {
      const { data: listData, error: listError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .list('statements', { limit: 5 });

      results.tests.listFiles = {
        success: !listError,
        error: listError?.message,
        fileCount: listData?.length || 0,
        sampleFiles: listData?.slice(0, 3).map(f => f.name),
      };
    } catch (e: any) {
      results.tests.listFiles = {
        success: false,
        error: e.message,
      };
    }

    // Test 2: Create a test file
    const testFileName = `test-delete-${Date.now()}.txt`;
    const testContent = 'This is a test file for deletion';
    
    try {
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(testFileName, Buffer.from(testContent), {
          contentType: 'text/plain',
          upsert: false,
        });

      results.tests.createTestFile = {
        success: !uploadError,
        error: uploadError?.message,
        path: uploadData?.path,
      };

      // Test 3: Delete the test file
      if (!uploadError && uploadData?.path) {
        try {
          const { error: deleteError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove([testFileName]);

          results.tests.deleteTestFile = {
            success: !deleteError,
            error: deleteError?.message,
          };

          // Verify deletion
          const { data: checkData, error: checkError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .download(testFileName);

          results.tests.verifyDeletion = {
            fileStillExists: !checkError || checkError.message !== 'Object not found',
            error: checkError?.message,
          };
        } catch (e: any) {
          results.tests.deleteTestFile = {
            success: false,
            error: e.message,
          };
        }
      }
    } catch (e: any) {
      results.tests.createTestFile = {
        success: false,
        error: e.message,
      };
    }

    // Test 4: Try to delete a specific file if provided
    if (testFilePath) {
      try {
        const { error: deleteError } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .remove([testFilePath]);

        results.tests.deleteSpecificFile = {
          path: testFilePath,
          success: !deleteError,
          error: deleteError?.message,
        };
      } catch (e: any) {
        results.tests.deleteSpecificFile = {
          path: testFilePath,
          success: false,
          error: e.message,
        };
      }
    }

    // Test 5: Check bucket policies
    try {
      // Try to get bucket details
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
      
      results.tests.bucketInfo = {
        success: !bucketsError,
        error: bucketsError?.message,
        currentBucket: STORAGE_BUCKET,
        availableBuckets: buckets?.map(b => b.name),
        bucketExists: buckets?.some(b => b.name === STORAGE_BUCKET),
      };
    } catch (e: any) {
      results.tests.bucketInfo = {
        success: false,
        error: e.message,
      };
    }

    return NextResponse.json({
      success: true,
      results,
      recommendations: getRecommendations(results),
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

function getRecommendations(results: any): string[] {
  const recommendations: string[] = [];

  if (!results.configCheck.hasAdmin) {
    recommendations.push('Supabase admin client is not initialized. Check your environment variables.');
  }

  if (!results.tests.bucketInfo?.bucketExists) {
    recommendations.push(`Bucket "${STORAGE_BUCKET}" does not exist. Create it in Supabase or update SUPABASE_BUCKET env var.`);
  }

  if (results.tests.listFiles?.success && results.tests.deleteTestFile?.success === false) {
    recommendations.push('Can list files but cannot delete. Check storage policies in Supabase.');
  }

  if (results.tests.createTestFile?.success === false) {
    recommendations.push('Cannot create files. Check write permissions for the service role.');
  }

  if (results.tests.deleteTestFile?.success === false) {
    recommendations.push('Cannot delete files. Service role may lack delete permissions.');
  }

  if (recommendations.length === 0 && results.tests.deleteTestFile?.success) {
    recommendations.push('All tests passed! Deletion should work correctly.');
  }

  return recommendations;
}