import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { File } from '@/models/File';
import { Types } from 'mongoose';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';
import { ocrService } from '@/lib/ocr';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accountName = formData.get('accountName') as string;
    const bankName = formData.get('bankName') as string;
    const month = parseInt(formData.get('month') as string);
    const year = parseInt(formData.get('year') as string);

    // Validate required fields
    if (!file || !accountName || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: file, accountName, month, year' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF, JPEG, PNG, or TIFF files.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = file.name.split('.').pop();
    const fileName = `statements/${year}/${month}/${timestamp}_${sanitizedFileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    // Create file record in database
    const fileDoc = await File.create({
      filename: fileName,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedBy: new Types.ObjectId(session.user.id),
      storageProvider: 'supabase',
      url: publicUrl,
      bucket: STORAGE_BUCKET,
      path: fileName,
    });

    // Create statement record
    const statement = await Statement.create({
      accountName,
      bankName: bankName || 'Unknown Bank',
      month,
      year,
      sourceFile: fileDoc._id,
      status: 'uploaded',
      currency: 'USD',
      createdBy: new Types.ObjectId(session.user.id),
    });

    // Start OCR processing asynchronously
    processOCR(statement._id.toString(), buffer, file.type).catch(error => {
      console.error('Background OCR processing failed:', error);
    });

    // Populate the file reference for response
    const populatedStatement = await Statement
      .findById(statement._id)
      .populate('sourceFile')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedStatement,
      message: 'Statement uploaded successfully. OCR processing has started.',
    });

  } catch (error: any) {
    console.error('Statement upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload statement',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Background OCR processing function
async function processOCR(statementId: string, buffer: Buffer, mimeType: string) {
  try {
    let extractedText = '';
    let ocrProvider = 'tesseract';
    let confidence: number | undefined;

    // Handle PDFs
    if (mimeType === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse/lib/pdf-parse');
        const pdfResult = await pdfParse(buffer);
        extractedText = pdfResult.text;
        ocrProvider = 'pdf-parse';
        
        // If PDF has no extractable text, mark for manual OCR
        if (!extractedText || extractedText.trim().length < 50) {
          await Statement.findByIdAndUpdate(statementId, {
            status: 'needs_review',
            ocrProvider: 'pdf-parse',
            extractedData: {
              rawText: extractedText || '',
              message: 'PDF appears to be scanned. Manual OCR processing may be required.',
            },
          });
          return;
        }
      } catch (error) {
        console.error('PDF processing error:', error);
        await Statement.findByIdAndUpdate(statementId, {
          status: 'failed',
          errors: ['PDF processing failed'],
        });
        return;
      }
    } else {
      // Process images with OCR
      const ocrResult = await ocrService.extractTextFromImage(buffer, mimeType);
      extractedText = ocrResult.text;
      ocrProvider = ocrResult.provider;
      confidence = ocrResult.confidence;
    }

    // Parse bank statement data
    const statementData = ocrService.parseBankStatement(extractedText);

    // Update statement with extracted data
    await Statement.findByIdAndUpdate(statementId, {
      status: 'extracted',
      ocrProvider: ocrProvider === 'google-vision' ? 'docai' : ocrProvider === 'pdf-parse' ? 'textract' : 'tesseract',
      extractedData: {
        rawText: extractedText,
        parsedData: statementData,
        confidence: confidence,
      },
      extractedAt: new Date(),
    });

    console.log(`OCR processing completed for statement ${statementId}`);

  } catch (error) {
    console.error(`OCR processing failed for statement ${statementId}:`, error);
    
    await Statement.findByIdAndUpdate(statementId, {
      status: 'failed',
      errors: ['OCR processing failed: ' + (error as Error).message],
    });
  }
}
