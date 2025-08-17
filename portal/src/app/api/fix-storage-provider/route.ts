import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { File } from '@/models/File';
import { supabaseAdmin, SUPABASE_STATUS } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check storage configuration
    const supabaseConfigured = !!supabaseAdmin;

    // Find all files marked as 'supabase' storage
    const supabaseFiles = await File.find({ storageProvider: 'supabase' }).lean();

    const analysis = {
      storage: {
        supabase: {
          configured: supabaseConfigured,
          status: SUPABASE_STATUS
        }
      },
      files: {
        markedAsSupabase: supabaseFiles.length,
        total: supabaseFiles.length
      }
    };

    // Determine recommendation
    if (!supabaseConfigured && supabaseFiles.length > 0) {
      analysis.recommendation = 'Supabase is not configured but files are marked as Supabase. Please configure Supabase.';
    } else if (supabaseConfigured && supabaseFiles.length === 0) {
      analysis.recommendation = 'Supabase is configured but no files found. Ready for uploads.';
    } else if (supabaseConfigured && supabaseFiles.length > 0) {
      analysis.recommendation = 'Supabase is configured and files are properly marked. System is ready.';
    } else {
      analysis.recommendation = 'No storage configured. Please configure Supabase.';
    }

    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error: any) {
    console.error('Error analyzing storage:', error);
    return NextResponse.json(
      { error: 'Failed to analyze storage', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check storage configuration
    const supabaseConfigured = !!supabaseAdmin;

    if (!supabaseConfigured) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Cannot fix storage providers.' },
        { status: 400 }
      );
    }

    // Find files that need fixing
    const filesToFix = await File.find({
      $or: [
        { storageProvider: { $exists: false } },
        { storageProvider: 'local' }
      ]
    }).lean();

    if (filesToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files need fixing. All files are properly configured.',
        filesFixed: 0
      });
    }

    // Update files to use Supabase
    const updateResult = await File.updateMany(
      {
        $or: [
          { storageProvider: { $exists: false } },
          { storageProvider: 'local' }
        ]
      },
      {
        $set: {
          storageProvider: 'supabase',
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Fixed ${updateResult.modifiedCount} files to use Supabase storage`,
      filesFixed: updateResult.modifiedCount,
      totalFiles: filesToFix.length
    });

  } catch (error: any) {
    console.error('Error fixing storage providers:', error);
    return NextResponse.json(
      { error: 'Failed to fix storage providers', details: error.message },
      { status: 500 }
    );
  }
}