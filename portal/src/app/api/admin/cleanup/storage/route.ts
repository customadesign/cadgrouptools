import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { File } from '@/models/File';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';

// POST /api/admin/cleanup/storage - Clean up orphaned files
export async function POST(request: NextRequest) {
  try {
    // Check authentication - admin only
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectToDatabase();

    // Get dryRun parameter
    const { dryRun = true } = await request.json();

    const cleanupResults = {
      orphanedFiles: [] as string[],
      deletedFiles: [] as string[],
      errors: [] as string[],
      totalOrphaned: 0,
      totalDeleted: 0,
      storageSpaceFreed: 0,
    };

    // Step 1: Get all files from Supabase storage
    const { data: storageFiles, error: listError } = await supabaseAdmin
      .storage
      .from(STORAGE_BUCKET)
      .list('', {
        limit: 1000,
        offset: 0,
      });

    if (listError) {
      console.error('Error listing storage files:', listError);
      return NextResponse.json(
        { error: 'Failed to list storage files', details: listError.message },
        { status: 500 }
      );
    }

    if (!storageFiles) {
      return NextResponse.json({ 
        message: 'No files found in storage',
        ...cleanupResults 
      });
    }

    // Step 2: Get all file references from database
    const dbFiles = await File.find({ storageProvider: 'supabase' })
      .select('path fileName')
      .lean();

    const dbFilePaths = new Set(
      dbFiles.map(f => f.path || f.fileName).filter(Boolean)
    );

    // Step 3: Find orphaned files (in storage but not in database)
    for (const storageFile of storageFiles) {
      if (!dbFilePaths.has(storageFile.name)) {
        cleanupResults.orphanedFiles.push(storageFile.name);
        cleanupResults.totalOrphaned++;
        cleanupResults.storageSpaceFreed += storageFile.metadata?.size || 0;

        // Delete the file if not in dry run mode
        if (!dryRun) {
          try {
            const { error: deleteError } = await supabaseAdmin
              .storage
              .from(STORAGE_BUCKET)
              .remove([storageFile.name]);

            if (deleteError) {
              console.error(`Failed to delete ${storageFile.name}:`, deleteError);
              cleanupResults.errors.push(`Failed to delete ${storageFile.name}: ${deleteError.message}`);
            } else {
              cleanupResults.deletedFiles.push(storageFile.name);
              cleanupResults.totalDeleted++;
            }
          } catch (error) {
            console.error(`Error deleting ${storageFile.name}:`, error);
            cleanupResults.errors.push(`Error deleting ${storageFile.name}: ${error}`);
          }
        }
      }
    }

    // Step 4: Clean up database records with missing storage files
    const missingStorageFiles = [];
    for (const dbFile of dbFiles) {
      const filePath = dbFile.path || dbFile.fileName;
      if (filePath) {
        // Check if file exists in storage
        const exists = storageFiles.some(sf => sf.name === filePath);
        if (!exists) {
          missingStorageFiles.push(dbFile._id);
        }
      }
    }

    if (missingStorageFiles.length > 0 && !dryRun) {
      // Remove database records for files that don't exist in storage
      await File.deleteMany({ 
        _id: { $in: missingStorageFiles },
        storageProvider: 'supabase'
      });
    }

    // Step 5: Clean up old temporary/incomplete uploads (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldTempFiles = await File.deleteMany({
      storageProvider: 'supabase',
      createdAt: { $lt: oneDayAgo },
      $or: [
        { url: { $exists: false } },
        { url: null },
        { url: '' },
      ],
    });

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? 'Dry run completed. No files were deleted.' 
        : 'Storage cleanup completed successfully.',
      dryRun,
      results: {
        ...cleanupResults,
        storageSpaceFreedMB: Math.round(cleanupResults.storageSpaceFreed / 1024 / 1024 * 100) / 100,
        missingInStorage: missingStorageFiles.length,
        oldTempFilesDeleted: oldTempFiles.deletedCount,
      },
    });

  } catch (error: any) {
    console.error('Storage cleanup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run storage cleanup',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/cleanup/storage - Get storage usage statistics
export async function GET(request: NextRequest) {
  try {
    // Check authentication - admin only
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectToDatabase();

    // Get storage statistics
    const { data: storageFiles, error: listError } = await supabaseAdmin
      .storage
      .from(STORAGE_BUCKET)
      .list('', {
        limit: 1000,
        offset: 0,
      });

    if (listError) {
      return NextResponse.json(
        { error: 'Failed to get storage statistics', details: listError.message },
        { status: 500 }
      );
    }

    const totalFiles = storageFiles?.length || 0;
    const totalSize = storageFiles?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;

    // Get database file count
    const dbFileCount = await File.countDocuments({ storageProvider: 'supabase' });

    // Get breakdown by file type
    const fileTypeBreakdown = storageFiles?.reduce((acc, file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      if (!acc[ext]) {
        acc[ext] = { count: 0, size: 0 };
      }
      acc[ext].count++;
      acc[ext].size += file.metadata?.size || 0;
      return acc;
    }, {} as Record<string, { count: number; size: number }>);

    return NextResponse.json({
      success: true,
      statistics: {
        storage: {
          totalFiles,
          totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
          fileTypes: fileTypeBreakdown,
        },
        database: {
          totalRecords: dbFileCount,
        },
        potentialOrphans: Math.max(0, totalFiles - dbFileCount),
      },
    });

  } catch (error: any) {
    console.error('Storage statistics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get storage statistics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
