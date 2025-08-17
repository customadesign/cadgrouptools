import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';
import { Types } from 'mongoose';

// POST: Verify multiple files in batch
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { statementIds } = await request.json();

    if (!statementIds || !Array.isArray(statementIds)) {
      return NextResponse.json(
        { error: 'Invalid request. Expected array of statement IDs.' },
        { status: 400 }
      );
    }

    // Validate all IDs
    const validIds = statementIds.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length !== statementIds.length) {
      return NextResponse.json(
        { error: 'Some statement IDs are invalid' },
        { status: 400 }
      );
    }

    // Fetch all statements with file details
    const statements = await Statement
      .find({ _id: { $in: validIds } })
      .populate('sourceFile')
      .lean();

    const verificationResults = await Promise.all(
      statements.map(async (statement) => {
        const result: any = {
          statementId: statement._id.toString(),
          fileName: statement.sourceFile?.originalName || statement.sourceFile?.filename || 'Unknown',
        };

        if (!statement.sourceFile) {
          return {
            ...result,
            exists: false,
            verified: true,
            reason: 'No file record in database',
          };
        }

        const fileDoc = statement.sourceFile;
        result.storageProvider = fileDoc.storageProvider;
        result.path = fileDoc.path;

        // Check file existence based on storage provider
        if (fileDoc.storageProvider === 'supabase' && fileDoc.path) {
          if (!supabaseAdmin) {
            return {
              ...result,
              exists: false,
              verified: true,
              reason: 'Supabase not configured',
            };
          }

          try {
            // Use list method for batch checking (more efficient)
            const pathDir = fileDoc.path.split('/').slice(0, -1).join('/');
            const fileName = fileDoc.path.split('/').pop();
            
            const { data: files, error } = await supabaseAdmin.storage
              .from(STORAGE_BUCKET)
              .list(pathDir, {
                limit: 1000,
                search: fileName,
              });

            if (error) {
              return {
                ...result,
                exists: false,
                verified: true,
                error: error.message,
              };
            }

            const fileExists = files?.some(f => f.name === fileName) || false;
            return {
              ...result,
              exists: fileExists,
              verified: true,
            };
          } catch (error: any) {
            return {
              ...result,
              exists: false,
              verified: true,
              error: error.message,
            };
          }
        } else {
          return {
            ...result,
            exists: false,
            verified: true,
            reason: 'Unsupported storage provider or missing path',
          };
        }
      })
    );

    // Summary statistics
    const summary = {
      total: verificationResults.length,
      existing: verificationResults.filter(r => r.exists).length,
      missing: verificationResults.filter(r => !r.exists).length,
      orphaned: verificationResults.filter(r => !r.exists).map(r => r.statementId),
    };

    return NextResponse.json({
      success: true,
      results: verificationResults,
      summary,
    });

  } catch (error: any) {
    console.error('Error in batch verification:', error);
    return NextResponse.json(
      { error: 'Failed to verify files', details: error.message },
      { status: 500 }
    );
  }
}