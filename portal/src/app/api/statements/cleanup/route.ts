import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { File } from '@/models/File';
import { supabaseAdmin, STORAGE_BUCKET, SUPABASE_STATUS } from '@/lib/supabaseAdmin';
import { getS3Client, BUCKET as S3_BUCKET } from '@/lib/s3';
import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// GET: Perform cleanup and report status
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const report: any = {
      timestamp: new Date().toISOString(),
      storage: {
        supabase: SUPABASE_STATUS,
        s3: {
          configured: !!getS3Client(),
          bucket: S3_BUCKET
        }
      },
      database: {
        statements: 0,
        files: 0,
        orphanedFiles: 0,
        statementsWithoutFiles: 0,
        filesWithoutStatements: 0
      },
      storageFiles: {
        supabase: [],
        s3: []
      },
      recommendations: []
    };

    // 1. Database Analysis
    const statements = await Statement.find({}).populate('sourceFile');
    const files = await File.find({});
    
    report.database.statements = statements.length;
    report.database.files = files.length;

    // Find orphaned files (files not referenced by any statement)
    const statementFileIds = statements
      .filter(s => s.sourceFile)
      .map(s => (s.sourceFile as any)._id?.toString());
    
    const orphanedFiles = files.filter(f => 
      !statementFileIds.includes(f._id.toString())
    );
    
    report.database.orphanedFiles = orphanedFiles.length;
    report.database.statementsWithoutFiles = statements.filter(s => !s.sourceFile).length;
    report.database.filesWithoutStatements = orphanedFiles.length;

    // 2. Storage Analysis - Supabase
    if (supabaseAdmin) {
      try {
        const { data: supabaseFiles, error } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .list('statements', { limit: 1000 });
        
        if (!error && supabaseFiles) {
          report.storageFiles.supabase = supabaseFiles.map(f => ({
            name: f.name,
            size: f.metadata?.size,
            created_at: f.created_at,
            path: `statements/${f.name}`
          }));
        }
      } catch (e: any) {
        report.storageFiles.supabaseError = e.message;
      }
    }

    // 3. Storage Analysis - S3
    const s3Client = getS3Client();
    if (s3Client && S3_BUCKET) {
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: S3_BUCKET,
          Prefix: 'statements/',
          MaxKeys: 1000
        });
        
        const s3Response = await s3Client.send(listCommand);
        
        if (s3Response.Contents) {
          report.storageFiles.s3 = s3Response.Contents.map(obj => ({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            storageClass: obj.StorageClass
          }));
        }
      } catch (e: any) {
        report.storageFiles.s3Error = e.message;
      }
    }

    // 4. Cross-reference analysis
    const dbFilePaths = files.map(f => (f as any).path).filter(Boolean);
    const supabasePaths = report.storageFiles.supabase.map((f: any) => f.path);
    const s3Keys = report.storageFiles.s3.map((f: any) => f.key);

    // Files in storage but not in database
    const orphanedSupabaseFiles = supabasePaths.filter((path: string) => 
      !dbFilePaths.includes(path)
    );
    const orphanedS3Files = s3Keys.filter((key: string) => 
      !dbFilePaths.includes(key)
    );

    report.analysis = {
      orphanedSupabaseFiles: orphanedSupabaseFiles.length,
      orphanedS3Files: orphanedS3Files.length,
      supabaseFilesNotInDb: orphanedSupabaseFiles,
      s3FilesNotInDb: orphanedS3Files
    };

    // 5. Generate recommendations
    if (orphanedFiles.length > 0) {
      report.recommendations.push({
        type: 'cleanup',
        message: `Found ${orphanedFiles.length} orphaned file records in database`,
        action: 'POST to /api/statements/cleanup to remove orphaned records'
      });
    }

    if (orphanedSupabaseFiles.length > 0) {
      report.recommendations.push({
        type: 'storage_cleanup',
        message: `Found ${orphanedSupabaseFiles.length} files in Supabase not tracked in database`,
        action: 'These may be from failed uploads or deleted statements'
      });
    }

    if (orphanedS3Files.length > 0) {
      report.recommendations.push({
        type: 'storage_cleanup',
        message: `Found ${orphanedS3Files.length} files in S3 not tracked in database`,
        action: 'These may be from failed uploads or deleted statements'
      });
    }

    if (!supabaseAdmin && !s3Client) {
      report.recommendations.push({
        type: 'configuration',
        message: 'No storage provider configured',
        action: 'Configure either Supabase or S3 for file storage'
      });
    }

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error: any) {
    console.error('Cleanup analysis error:', error);
    return NextResponse.json({
      error: 'Failed to analyze cleanup status',
      details: error.message
    }, { status: 500 });
  }
}

// POST: Perform actual cleanup
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { cleanupType = 'all', dryRun = true } = body;

    const results: any = {
      timestamp: new Date().toISOString(),
      dryRun,
      cleanupType,
      database: {
        orphanedFilesRemoved: 0,
        errors: []
      },
      storage: {
        supabase: {
          filesRemoved: 0,
          errors: []
        },
        s3: {
          filesRemoved: 0,
          errors: []
        }
      }
    };

    // 1. Clean up orphaned database records
    if (cleanupType === 'all' || cleanupType === 'database') {
      const statements = await Statement.find({}).populate('sourceFile');
      const files = await File.find({});
      
      const statementFileIds = statements
        .filter(s => s.sourceFile)
        .map(s => (s.sourceFile as any)._id?.toString());
      
      const orphanedFiles = files.filter(f => 
        !statementFileIds.includes(f._id.toString())
      );

      if (!dryRun) {
        for (const file of orphanedFiles) {
          try {
            await File.findByIdAndDelete(file._id);
            results.database.orphanedFilesRemoved++;
          } catch (e: any) {
            results.database.errors.push({
              fileId: file._id,
              error: e.message
            });
          }
        }
      } else {
        results.database.orphanedFilesRemoved = orphanedFiles.length;
        results.database.orphanedFiles = orphanedFiles.map(f => ({
          id: f._id,
          originalName: (f as any).originalName,
          path: (f as any).path
        }));
      }
    }

    // 2. Clean up orphaned storage files
    if (cleanupType === 'all' || cleanupType === 'storage') {
      const files = await File.find({});
      const dbFilePaths = files.map(f => (f as any).path).filter(Boolean);

      // Supabase cleanup
      if (supabaseAdmin) {
        try {
          const { data: supabaseFiles, error } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .list('statements', { limit: 1000 });
          
          if (!error && supabaseFiles) {
            const orphanedSupabaseFiles = supabaseFiles.filter(f => 
              !dbFilePaths.includes(`statements/${f.name}`)
            );

            if (!dryRun) {
              for (const file of orphanedSupabaseFiles) {
                try {
                  const { error: deleteError } = await supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .remove([`statements/${file.name}`]);
                  
                  if (!deleteError) {
                    results.storage.supabase.filesRemoved++;
                  } else {
                    results.storage.supabase.errors.push({
                      file: file.name,
                      error: deleteError.message
                    });
                  }
                } catch (e: any) {
                  results.storage.supabase.errors.push({
                    file: file.name,
                    error: e.message
                  });
                }
              }
            } else {
              results.storage.supabase.filesRemoved = orphanedSupabaseFiles.length;
              results.storage.supabase.orphanedFiles = orphanedSupabaseFiles.map(f => f.name);
            }
          }
        } catch (e: any) {
          results.storage.supabase.errors.push({
            type: 'list',
            error: e.message
          });
        }
      }

      // S3 cleanup
      const s3Client = getS3Client();
      if (s3Client && S3_BUCKET) {
        try {
          const listCommand = new ListObjectsV2Command({
            Bucket: S3_BUCKET,
            Prefix: 'statements/',
            MaxKeys: 1000
          });
          
          const s3Response = await s3Client.send(listCommand);
          
          if (s3Response.Contents) {
            const orphanedS3Files = s3Response.Contents.filter(obj => 
              obj.Key && !dbFilePaths.includes(obj.Key)
            );

            if (!dryRun) {
              for (const file of orphanedS3Files) {
                if (!file.Key) continue;
                
                try {
                  const deleteCommand = new DeleteObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: file.Key
                  });
                  
                  await s3Client.send(deleteCommand);
                  results.storage.s3.filesRemoved++;
                } catch (e: any) {
                  results.storage.s3.errors.push({
                    file: file.Key,
                    error: e.message
                  });
                }
              }
            } else {
              results.storage.s3.filesRemoved = orphanedS3Files.length;
              results.storage.s3.orphanedFiles = orphanedS3Files.map(f => f.Key);
            }
          }
        } catch (e: any) {
          results.storage.s3.errors.push({
            type: 'list',
            error: e.message
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('Cleanup execution error:', error);
    return NextResponse.json({
      error: 'Failed to execute cleanup',
      details: error.message
    }, { status: 500 });
  }
}