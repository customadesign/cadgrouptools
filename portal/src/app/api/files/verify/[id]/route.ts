import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { File } from '@/models/File';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';
import { Types } from 'mongoose';

// GET: Verify if a file exists in storage
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = params;

    // Validate MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid statement ID format' },
        { status: 400 }
      );
    }

    // Fetch statement with file details
    const statement = await Statement
      .findById(id)
      .populate('sourceFile')
      .lean();

    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Check if file record exists
    if (!statement.sourceFile) {
      return NextResponse.json({
        exists: false,
        verified: true,
        reason: 'No file record in database',
        statementId: id,
      });
    }

    const fileDoc = statement.sourceFile;
    let fileExists = false;
    let verificationDetails: any = {
      provider: fileDoc.storageProvider,
      path: fileDoc.path,
    };

    // Check file existence based on storage provider
    if (fileDoc.storageProvider === 'supabase' && fileDoc.path) {
      if (!supabaseAdmin) {
        return NextResponse.json({
          exists: false,
          verified: true,
          reason: 'Supabase not configured',
          details: verificationDetails,
        });
      }

      try {
        // Try to download the file to check if it exists
        const { data, error } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .download(fileDoc.path);

        if (error) {
          if (error.message.includes('not found')) {
            fileExists = false;
            verificationDetails.error = 'File not found in Supabase storage';
          } else {
            // Other errors might not mean the file doesn't exist
            fileExists = false;
            verificationDetails.error = error.message;
          }
        } else {
          fileExists = true;
          verificationDetails.size = data?.size;
          verificationDetails.type = data?.type;
        }
      } catch (error: any) {
        fileExists = false;
        verificationDetails.error = error.message;
      }
    } else if (fileDoc.storageProvider === 'local') {
      // For local storage, check if file exists in filesystem
      // This would require additional implementation based on your local storage setup
      fileExists = false;
      verificationDetails.reason = 'Local storage verification not implemented';
    } else {
      fileExists = false;
      verificationDetails.reason = 'Unknown storage provider';
    }

    return NextResponse.json({
      exists: fileExists,
      verified: true,
      statementId: id,
              fileName: fileDoc.originalName || fileDoc.fileName,
      storageProvider: fileDoc.storageProvider,
      details: verificationDetails,
    });

  } catch (error: any) {
    console.error('Error verifying file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify file', 
        details: error.message,
        exists: false,
        verified: false,
      },
      { status: 500 }
    );
  }
}