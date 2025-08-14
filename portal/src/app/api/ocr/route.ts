import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { ocrService } from '@/lib/ocr';
import connectDB from '@/lib/mongodb';
import { Statement } from '@/models/Statement';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const provider = formData.get('provider') as string || 'auto';
    const statementId = formData.get('statementId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image or PDF file.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // For PDFs, we need to convert to image first (simplified for now)
    if (file.type === 'application/pdf') {
      return NextResponse.json(
        { 
          error: 'PDF processing requires additional setup. Please upload an image file for now.',
          suggestion: 'Convert your PDF to JPG/PNG and upload the image.'
        },
        { status: 400 }
      );
    }

    // Perform OCR
    console.log(`Starting OCR processing with provider: ${provider}`);
    const ocrResult = await ocrService.extractTextFromImage(buffer, file.type);

    // Parse bank statement data from OCR text
    const statementData = ocrService.parseBankStatement(ocrResult.text);

    // Update statement record if ID provided
    if (statementId) {
      await connectDB();
      await Statement.findByIdAndUpdate(
        statementId,
        {
          status: 'extracted',
          ocrProvider: ocrResult.provider === 'google-vision' ? 'docai' : 'tesseract',
          extractedData: {
            rawText: ocrResult.text,
            parsedData: statementData,
            confidence: ocrResult.confidence,
          },
        },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      provider: ocrResult.provider,
      confidence: ocrResult.confidence,
      extractedText: ocrResult.text,
      parsedData: statementData,
      message: `Successfully extracted text using ${ocrResult.provider}`,
    });

  } catch (error: any) {
    console.error('OCR API error:', error);
    
    // Provide helpful error messages
    let errorMessage = 'OCR processing failed';
    let statusCode = 500;

    if (error.message.includes('Google Vision')) {
      errorMessage = 'Google Vision OCR failed. Ensure your credentials are properly configured.';
      statusCode = 503;
    } else if (error.message.includes('Tesseract')) {
      errorMessage = 'Tesseract OCR failed. The image may be corrupted or unreadable.';
      statusCode = 422;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        provider: error.provider || 'unknown'
      },
      { status: statusCode }
    );
  }
}

// GET endpoint to check OCR service status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check which OCR providers are available
    const googleAvailable = !!(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_PROJECT_ID);
    const tesseractAvailable = true; // Always available as it's client-side

    return NextResponse.json({
      status: 'ready',
      providers: {
        googleVision: {
          available: googleAvailable,
          configured: googleAvailable,
          projectId: process.env.GOOGLE_PROJECT_ID ? 'configured' : 'not configured',
        },
        tesseract: {
          available: tesseractAvailable,
          configured: true,
        },
      },
      defaultProvider: googleAvailable ? 'google-vision' : 'tesseract',
    });

  } catch (error: any) {
    console.error('OCR status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check OCR service status' },
      { status: 500 }
    );
  }
}