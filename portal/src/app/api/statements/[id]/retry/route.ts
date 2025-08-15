import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';
import { processStatementOCR } from '@/lib/ocr/processStatement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/statements/:id/retry - re-run OCR on an existing statement
export async function POST(
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
    const statement = await Statement.findById(id).populate('sourceFile');
    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    if (!statement.sourceFile?.path) {
      return NextResponse.json({ error: 'Source file unavailable for retry' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Storage is not configured' }, { status: 500 });
    }

    // Download original file from Supabase
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(statement.sourceFile.path);
    if (error || !data) {
      return NextResponse.json({ error: 'Failed to download source file' }, { status: 500 });
    }
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set status to processing and clear previous errors
    await Statement.findByIdAndUpdate(id, {
      status: 'processing',
      processingErrors: [],
    });

    // Re-run OCR (async but awaited here for immediate feedback)
    await processStatementOCR(id, buffer, statement.sourceFile.mimeType || 'application/pdf');

    const refreshed = await Statement.findById(id).lean();
    return NextResponse.json({ success: true, data: refreshed });
  } catch (error: any) {
    return NextResponse.json({ error: 'Retry failed', details: error.message }, { status: 500 });
  }
}


