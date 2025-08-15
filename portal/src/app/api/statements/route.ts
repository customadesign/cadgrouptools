import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { File } from '@/models/File';
import { Types } from 'mongoose';
import { withActivityTracking } from '@/middleware/activityTracking';

// GET: Fetch statements with pagination and filtering
export const GET = withActivityTracking(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const accountName = searchParams.get('account');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // Build filter
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (accountName) filter.accountName = accountName;
    if (year) filter.year = parseInt(year);
    if (month) filter.month = parseInt(month);

    // Get total count
    const total = await Statement.countDocuments(filter);

    // Fetch statements with pagination
    const statements = await Statement
      .find(filter)
      .populate('sourceFile')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: statements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statements', details: error.message },
      { status: 500 }
    );
  }
});

// POST: Create a new statement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      fileName,
      fileSize,
      fileType,
      accountName,
      bankName,
      month,
      year,
      status = 'uploaded',
      ocrProvider = 'tesseract',
      transactionsFound = 0,
      transactionsImported = 0,
    } = body;

    // Validate required fields
    if (!fileName || !accountName || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create file record
    const file = await File.create({
      filename: fileName,
      originalName: fileName,
      mimeType: fileType || 'application/pdf',
      size: fileSize,
      uploadedBy: new Types.ObjectId(session.user.id),
      storageProvider: 'local',
      url: `/uploads/${fileName}`,
    });

    // Create statement record
    const statement = await Statement.create({
      accountName,
      bankName,
      month,
      year,
      sourceFile: file._id,
      status,
      ocrProvider,
      currency: 'USD',
    });

    // Populate the file reference for response
    const populatedStatement = await Statement
      .findById(statement._id)
      .populate('sourceFile')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedStatement,
    });
  } catch (error: any) {
    console.error('Error creating statement:', error);
    return NextResponse.json(
      { error: 'Failed to create statement', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete multiple statements
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No statement IDs provided' },
        { status: 400 }
      );
    }

    // Find statements to get file references
    const statements = await Statement.find({
      _id: { $in: ids },
    });

    // Delete associated files
    const fileIds = statements
      .map(s => s.sourceFile)
      .filter(id => id);
    
    if (fileIds.length > 0) {
      await File.deleteMany({ _id: { $in: fileIds } });
    }

    // Delete statements
    const result = await Statement.deleteMany({
      _id: { $in: ids },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Error deleting statements:', error);
    return NextResponse.json(
      { error: 'Failed to delete statements', details: error.message },
      { status: 500 }
    );
  }
}