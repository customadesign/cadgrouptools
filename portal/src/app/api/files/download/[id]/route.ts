import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { File } from '@/models/File';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';
import { Types } from 'mongoose';

// GET: Download a file from storage
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
      return NextResponse.json(
        { error: 'No file associated with this statement' },
        { status: 404 }
      );
    }

    const fileDoc = statement.sourceFile;

    // Handle download based on storage provider
    if (fileDoc.storageProvider === 'supabase' && fileDoc.path) {
      if (!supabaseAdmin) {
        return NextResponse.json(
          { error: 'Storage service not configured' },
          { status: 503 }
        );
      }

      try {
        // Download file from Supabase
        const { data, error } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .download(fileDoc.path);

        if (error) {
          console.error('Supabase download error:', error);
          
          if (error.message.includes('not found')) {
            return NextResponse.json(
              { error: 'File not found in storage' },
              { status: 404 }
            );
          }
          
          return NextResponse.json(
            { error: 'Failed to download file from storage', details: error.message },
            { status: 500 }
          );
        }

        if (!data) {
          return NextResponse.json(
            { error: 'No data received from storage' },
            { status: 500 }
          );
        }

        // Convert Blob to ArrayBuffer then to Buffer
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Set appropriate headers for file download
        const headers = new Headers();
        headers.set('Content-Type', fileDoc.mimeType || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${fileDoc.originalName || fileDoc.filename || 'download'}"`);
        headers.set('Content-Length', buffer.length.toString());

        return new NextResponse(buffer, {
          status: 200,
          headers,
        });

      } catch (error: any) {
        console.error('Error downloading from Supabase:', error);
        return NextResponse.json(
          { error: 'Failed to download file', details: error.message },
          { status: 500 }
        );
      }
    } else if (fileDoc.storageProvider === 'local') {
      // Handle local storage download
      // This would require additional implementation based on your local storage setup
      return NextResponse.json(
        { error: 'Local storage download not implemented' },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { error: 'Unknown storage provider' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in download endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process download request', details: error.message },
      { status: 500 }
    );
  }
}