import { NextRequest, NextResponse } from 'next/server';

// Ensure Node.js runtime (needed for Buffer, require, pdf-parse)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Statement } from '@/models/Statement';
import { File } from '@/models/File';
import { Transaction } from '@/models/Transaction';
import { Types } from 'mongoose';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';
import { ocrService } from '@/lib/ocr';
import type { ExtractedTransaction } from '@/lib/ocr';

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

    // Ensure Supabase is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Storage is not configured', details: 'Supabase Admin client is not initialized. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE env vars.' },
        { status: 500 }
      );
    }

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
        const pdfParse = require('pdf-parse');
        const pdfResult = await pdfParse(buffer);
        extractedText = pdfResult.text;
        ocrProvider = 'pdf-parse';

        // If PDF has no extractable text, try a robust fallback with pdfjs textContent
        if (!extractedText || extractedText.trim().length < 50) {
          try {
            const fallbackText = await extractTextFromPdfWithPdfJs(buffer);
            extractedText = fallbackText;
            ocrProvider = 'pdfjs-dist';
          } catch (fallbackErr) {
            console.warn('pdfjs-dist fallback failed, marking needs_review:', fallbackErr);
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
        }
      } catch (error) {
        console.error('PDF processing error, attempting pdfjs-dist fallback:', error);
        try {
          const fallbackText = await extractTextFromPdfWithPdfJs(buffer);
          extractedText = fallbackText;
          ocrProvider = 'pdfjs-dist';
        } catch (fallbackErr) {
          console.error('PDF fallback (pdfjs) also failed:', fallbackErr);
          await Statement.findByIdAndUpdate(statementId, {
            status: 'failed',
            processingErrors: ['PDF processing failed', `Fallback failed: ${(fallbackErr as Error).message}`],
          });
          return;
        }
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
      ocrProvider,
      extractedData: {
        rawText: extractedText,
        parsedData: statementData,
        confidence: confidence,
      },
      extractedAt: new Date(),
    });

    // Create transaction records from parsed data
    if (statementData.transactions && statementData.transactions.length > 0) {
      await createTransactionsFromOCR(statementId, statementData.transactions);
    }

    console.log(`OCR processing completed for statement ${statementId}`);

  } catch (error) {
    console.error(`OCR processing failed for statement ${statementId}:`, error);
    
    await Statement.findByIdAndUpdate(statementId, {
      status: 'failed',
      processingErrors: ['OCR processing failed: ' + (error as Error).message],
    });
  }
}

// Fallback PDF text extraction using pdfjs-dist (no native deps)
async function extractTextFromPdfWithPdfJs(buffer: Buffer): Promise<string> {
  const pdfjs: any = await import('pdfjs-dist');
  // In Node we typically don't need a worker; pdfjs uses a fake worker
  const loadingTask = pdfjs.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  let combinedText = '';
  const maxPages = Math.min(pdf.numPages || 1, 20);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items || []).map((it: any) => it.str).join(' ');
    combinedText += `\n${pageText}`;
  }
  return combinedText.trim();
}

// Helper function to create transactions from OCR data with deduplication
async function createTransactionsFromOCR(
  statementId: string,
  extractedTransactions: ExtractedTransaction[]
): Promise<void> {
  try {
    // Get existing transactions for this statement to avoid duplicates
    const existingTransactions = await Transaction.find({ statement: statementId })
      .select('txnDate description amount direction')
      .lean();

    // Create a Set of existing transaction signatures for deduplication
    const existingSignatures = new Set(
      existingTransactions.map(t => 
        `${new Date(t.txnDate).toISOString().split('T')[0]}_${t.description}_${t.amount}_${t.direction}`
      )
    );

    // Prepare new transactions for bulk insert
    const newTransactions = [];
    const currentYear = new Date().getFullYear();

    for (const extracted of extractedTransactions) {
      // Parse date (handle various formats)
      let txnDate: Date;
      const dateParts = extracted.date.split('/');
      
      if (dateParts.length === 2) {
        // MM/DD format - assume current year
        const [month, day] = dateParts;
        txnDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
      } else if (dateParts.length === 3) {
        // MM/DD/YY or MM/DD/YYYY format
        const [month, day, year] = dateParts;
        const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
        txnDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
      } else {
        console.warn(`Skipping transaction with invalid date format: ${extracted.date}`);
        continue;
      }

      // Create transaction signature for deduplication
      const signature = `${txnDate.toISOString().split('T')[0]}_${extracted.description}_${extracted.amount}_${extracted.type}`;
      
      // Skip if transaction already exists
      if (existingSignatures.has(signature)) {
        console.log(`Skipping duplicate transaction: ${signature}`);
        continue;
      }

      // Add to new transactions list
      newTransactions.push({
        statement: new Types.ObjectId(statementId),
        txnDate,
        description: extracted.description,
        amount: extracted.amount,
        direction: extracted.type,
        balance: extracted.balance,
        confidence: 0.8, // Default confidence for OCR-extracted transactions
      });
    }

    // Bulk insert new transactions
    if (newTransactions.length > 0) {
      await Transaction.insertMany(newTransactions);
      console.log(`Created ${newTransactions.length} new transactions for statement ${statementId}`);
      
      // Update statement status to completed
      await Statement.findByIdAndUpdate(statementId, {
        status: 'completed',
        $inc: {
          transactionsFound: extractedTransactions.length,
          transactionsImported: newTransactions.length,
        },
      });
    } else {
      console.log(`No new transactions to create for statement ${statementId}`);
      
      // Update statement status to completed even if no new transactions
      await Statement.findByIdAndUpdate(statementId, {
        status: 'completed',
        transactionsFound: extractedTransactions.length,
        transactionsImported: 0,
      });
    }
  } catch (error) {
    console.error(`Error creating transactions for statement ${statementId}:`, error);
    throw error;
  }
}
