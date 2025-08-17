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

    const tests: any = {
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE,
        hasPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        bucket: STORAGE_BUCKET,
        supabaseUrl: process.env.SUPABASE_URL ? 
          process.env.SUPABASE_URL.substring(0, 30) + '...' : 
          'NOT SET',
      },
      client: {
        isInitialized: !!supabaseAdmin,
        type: supabaseAdmin ? 'service-role' : 'not-initialized'
      },
      tests: []
    };

    if (!supabaseAdmin) {
      tests.error = 'Supabase admin client not initialized';
      tests.recommendation = 'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables';
      return NextResponse.json(tests);
    }

    // Test 1: List buckets
    try {
      const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
      tests.tests.push({
        name: 'List Buckets',
        success: !error,
        data: error ? { error: error.message } : { 
          bucketCount: buckets?.length || 0,
          buckets: buckets?.map(b => ({ 
            name: b.name, 
            public: b.public,
            created_at: b.created_at 
          }))
        }
      });
    } catch (e: any) {
      tests.tests.push({
        name: 'List Buckets',
        success: false,
        error: e.message
      });
    }

    // Test 2: Check specific bucket
    try {
      const { data: bucketData, error } = await supabaseAdmin.storage.getBucket(STORAGE_BUCKET);
      tests.tests.push({
        name: `Check Bucket: ${STORAGE_BUCKET}`,
        success: !error,
        data: error ? { error: error.message } : {
          exists: !!bucketData,
          public: bucketData?.public,
          created_at: bucketData?.created_at
        }
      });
    } catch (e: any) {
      tests.tests.push({
        name: `Check Bucket: ${STORAGE_BUCKET}`,
        success: false,
        error: e.message
      });
    }

    // Test 3: List files in bucket
    try {
      const { data: files, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .list('statements', { limit: 5 });
      
      tests.tests.push({
        name: 'List Files in statements/',
        success: !error,
        data: error ? { error: error.message } : {
          fileCount: files?.length || 0,
          sampleFiles: files?.slice(0, 3).map(f => ({
            name: f.name,
            size: f.metadata?.size,
            created_at: f.created_at
          }))
        }
      });
    } catch (e: any) {
      tests.tests.push({
        name: 'List Files in statements/',
        success: false,
        error: e.message
      });
    }

    // Test 4: Create and delete test file
    try {
      const testPath = `test/delete-test-${Date.now()}.txt`;
      const testContent = new Blob(['Test file for deletion'], { type: 'text/plain' });
      
      // Upload test file
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(testPath, testContent);
      
      if (uploadError) {
        tests.tests.push({
          name: 'Upload/Delete Test',
          success: false,
          stage: 'upload',
          error: uploadError.message
        });
      } else {
        // Try to delete the test file
        const { data: deleteData, error: deleteError } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .remove([testPath]);
        
        if (deleteError) {
          tests.tests.push({
            name: 'Upload/Delete Test',
            success: false,
            stage: 'delete',
            error: deleteError.message,
            uploadedPath: testPath
          });
        } else {
          // Verify deletion
          const { error: verifyError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .download(testPath);
          
          tests.tests.push({
            name: 'Upload/Delete Test',
            success: true,
            data: {
              uploaded: true,
              deleted: true,
              verified: !!verifyError && verifyError.message.includes('not found')
            }
          });
        }
      }
    } catch (e: any) {
      tests.tests.push({
        name: 'Upload/Delete Test',
        success: false,
        error: e.message
      });
    }

    // Test 5: Check service role permissions
    try {
      // Service role should be able to bypass RLS
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      tests.tests.push({
        name: 'Service Role Permissions',
        success: !error,
        data: error ? { error: error.message } : {
          hasAdminAccess: true,
          userCount: data?.users?.length || 0
        }
      });
    } catch (e: any) {
      tests.tests.push({
        name: 'Service Role Permissions',
        success: false,
        error: e.message,
        note: 'This might indicate using anon key instead of service role key'
      });
    }

    // Calculate summary
    const summary = {
      totalTests: tests.tests.length,
      passed: tests.tests.filter((t: any) => t.success).length,
      failed: tests.tests.filter((t: any) => !t.success).length,
      successRate: Math.round((tests.tests.filter((t: any) => t.success).length / tests.tests.length) * 100)
    };

    tests.summary = summary;

    // Add recommendations
    if (summary.failed > 0) {
      tests.recommendations = [];
      
      if (!tests.environment.hasSupabaseUrl || !tests.environment.hasServiceRole) {
        tests.recommendations.push('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables');
      }
      
      const bucketTest = tests.tests.find((t: any) => t.name.includes('Check Bucket'));
      if (bucketTest && !bucketTest.success) {
        tests.recommendations.push(`Create bucket "${STORAGE_BUCKET}" in Supabase Storage`);
      }
      
      const permTest = tests.tests.find((t: any) => t.name === 'Service Role Permissions');
      if (permTest && !permTest.success) {
        tests.recommendations.push('Ensure using SERVICE_ROLE key, not ANON key');
      }
    }

    return NextResponse.json(tests);
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test suite failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}