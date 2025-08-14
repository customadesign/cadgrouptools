import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { ocrService } from '@/lib/ocr';
import connectDB from '@/lib/mongodb';
import { Statement } from '@/models/Statement';
// Import pdf-parse dynamically to avoid build issues

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

    let extractedText = '';
    let ocrProvider = 'pdf-parse';
    let confidence: number | undefined;

    // Handle PDFs
    if (file.type === 'application/pdf') {
      console.log('Processing PDF file...');
      
      try {
        // Dynamic import for PDF parsing
        const pdfParse = require('pdf-parse/lib/pdf-parse');
        const pdfResult = await pdfParse(buffer);
        extractedText = pdfResult.text;
        
        // If PDF has no extractable text (scanned PDF), try OCR
        if (!extractedText || extractedText.trim().length < 50) {
          console.log('PDF appears to be scanned, attempting OCR...');
          
          // For scanned PDFs, we would need to convert to image first
          // For now, we'll provide a helpful message
          return NextResponse.json({
            success: true,
            provider: 'pdf-parse',
            extractedText: extractedText || 'No text found in PDF',
            parsedData: ocrService.parseBankStatement(extractedText),
            message: 'PDF processed. For scanned PDFs with images, consider converting to JPG/PNG for better OCR results.',
            pdfInfo: {
              pages: pdfResult.numpages,
              hasText: extractedText.length > 0,
            }
          });
        }
        
        console.log(`Extracted ${extractedText.length} characters from PDF`);
      } catch (error: any) {
        console.error('PDF processing error:', error);
        return NextResponse.json(
          { 
            error: 'Failed to process PDF',
            details: error.message,
            suggestion: 'Try converting the PDF to an image format (JPG/PNG) for OCR processing'
          },
          { status: 400 }
        );
      }
    } else {
      // Process images with OCR
      console.log(`Starting OCR processing with provider: ${provider}`);
      const ocrResult = await ocrService.extractTextFromImage(buffer, file.type);
      extractedText = ocrResult.text;
      ocrProvider = ocrResult.provider;
      confidence = ocrResult.confidence;
    }

    // Parse bank statement data from extracted text
    const statementData = ocrService.parseBankStatement(extractedText);

    // Update statement record if ID provided
    if (statementId) {
      await connectDB();
      await Statement.findByIdAndUpdate(
        statementId,
        {
          status: 'extracted',
          ocrProvider: ocrProvider === 'google-vision' ? 'docai' : ocrProvider === 'pdf-parse' ? 'textract' : 'tesseract',
          extractedData: {
            rawText: extractedText,
            parsedData: statementData,
            confidence: confidence,
          },
        },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      provider: ocrProvider,
      confidence: confidence,
      extractedText: extractedText,
      parsedData: statementData,
      message: `Successfully extracted text using ${ocrProvider}`,
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