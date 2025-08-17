import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { File } from '@/models/File';
import { getS3Client, BUCKET as S3_BUCKET } from '@/lib/s3';
import { supabaseAdmin, SUPABASE_STATUS } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Check current storage configuration
    const s3Configured = !!getS3Client();
    const supabaseConfigured = SUPABASE_STATUS.initialized && !SUPABASE_STATUS.hasPlaceholders;
    
    // Find all files marked as 'supabase' storage
    const supabaseFiles = await File.find({ storageProvider: 'supabase' }).lean();
    
    // Find all files marked as 's3' storage
    const s3Files = await File.find({ storageProvider: 's3' }).lean();
    
    const analysis = {
      configuration: {
        s3: {
          configured: s3Configured,
          bucket: S3_BUCKET
        },
        supabase: {
          configured: supabaseConfigured,
          status: SUPABASE_STATUS
        }
      },
      files: {
        markedAsSupabase: supabaseFiles.length,
        markedAsS3: s3Files.length,
        total: supabaseFiles.length + s3Files.length
      },
      recommendation: null as string | null,
      needsFix: false
    };
    
    // Determine if we need to fix storage providers
    if (s3Configured && !supabaseConfigured && supabaseFiles.length > 0) {
      analysis.recommendation = 'S3 is configured but files are marked as Supabase. Run POST to fix.';
      analysis.needsFix = true;
    } else if (!s3Configured && supabaseConfigured && s3Files.length > 0) {
      analysis.recommendation = 'Supabase is configured but files are marked as S3. Run POST to fix.';
      analysis.needsFix = true;
    } else if (!s3Configured && !supabaseConfigured) {
      analysis.recommendation = 'No storage provider is properly configured!';
    } else {
      analysis.recommendation = 'Storage configuration appears correct.';
    }
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('[FIX-STORAGE] Error analyzing storage:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze storage configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const { dryRun = false } = await request.json().catch(() => ({ dryRun: false }));
    
    // Check current storage configuration
    const s3Configured = !!getS3Client();
    const supabaseConfigured = SUPABASE_STATUS.initialized && !SUPABASE_STATUS.hasPlaceholders;
    
    const results = {
      configuration: {
        s3: s3Configured,
        supabase: supabaseConfigured
      },
      filesUpdated: 0,
      errors: [] as string[],
      dryRun
    };
    
    // Determine which storage provider should be used
    let targetProvider: 's3' | 'supabase' | null = null;
    let wrongProvider: 's3' | 'supabase' | null = null;
    
    if (s3Configured && !supabaseConfigured) {
      targetProvider = 's3';
      wrongProvider = 'supabase';
    } else if (!s3Configured && supabaseConfigured) {
      targetProvider = 'supabase';
      wrongProvider = 's3';
    } else if (s3Configured && supabaseConfigured) {
      // Both configured - prefer S3 since it's been tested
      targetProvider = 's3';
      wrongProvider = 'supabase';
    } else {
      return NextResponse.json({
        error: 'No storage provider is properly configured',
        configuration: results.configuration
      }, { status: 400 });
    }
    
    // Find files with wrong storage provider
    const filesToFix = await File.find({ storageProvider: wrongProvider });
    
    if (filesToFix.length === 0) {
      return NextResponse.json({
        message: 'No files need updating',
        configuration: results.configuration,
        targetProvider
      });
    }
    
    if (!dryRun) {
      // Update all files to use the correct storage provider
      const updateResult = await File.updateMany(
        { storageProvider: wrongProvider },
        { $set: { storageProvider: targetProvider } }
      );
      
      results.filesUpdated = updateResult.modifiedCount;
      
      console.log(`[FIX-STORAGE] Updated ${results.filesUpdated} files from ${wrongProvider} to ${targetProvider}`);
    } else {
      results.filesUpdated = filesToFix.length;
    }
    
    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Would update ${results.filesUpdated} files from ${wrongProvider} to ${targetProvider}`
        : `Updated ${results.filesUpdated} files from ${wrongProvider} to ${targetProvider}`,
      ...results,
      targetProvider,
      wrongProvider
    });
    
  } catch (error) {
    console.error('[FIX-STORAGE] Error fixing storage providers:', error);
    return NextResponse.json({ 
      error: 'Failed to fix storage providers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}