import { Statement } from '@/models/Statement';
import { Transaction } from '@/models/Transaction';
import { Types } from 'mongoose';
import { ocrService, ExtractedTransaction } from '@/lib/ocr';

// Shared OCR processor used by upload and retry endpoints
export async function processStatementOCR(statementId: string, buffer: Buffer, mimeType: string) {
  try {
    let extractedText = '';
    let ocrProvider: 'pdf-parse' | 'pdfjs-dist' | 'google-vision' | 'tesseract' = 'tesseract';
    let confidence: number | undefined;

    // PDFs: try pdf-parse then pdfjs-dist fallback
    if (mimeType === 'application/pdf') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParse = require('pdf-parse');
        const pdfResult = await pdfParse(buffer);
        extractedText = pdfResult.text;
        ocrProvider = 'pdf-parse';

        if (!extractedText || extractedText.trim().length < 50) {
          const fallbackText = await extractTextFromPdfWithPdfJs(buffer);
          extractedText = fallbackText;
          ocrProvider = 'pdfjs-dist';
        }
      } catch (err) {
        try {
          const fallbackText = await extractTextFromPdfWithPdfJs(buffer);
          extractedText = fallbackText;
          ocrProvider = 'pdfjs-dist';
        } catch (fallbackErr) {
          await Statement.findByIdAndUpdate(statementId, {
            status: 'failed',
            processingErrors: ['PDF processing failed', `Fallback failed: ${(fallbackErr as Error).message}`],
          });
          return;
        }
      }
    } else {
      // Images: try Google Vision then fallback to Tesseract
      const ocrResult = await ocrService.extractTextFromImage(buffer, mimeType);
      extractedText = ocrResult.text;
      ocrProvider = (ocrResult.provider as any);
      confidence = ocrResult.confidence;
    }

    // Parse bank statement text
    const statementData = ocrService.parseBankStatement(extractedText);

    // Update statement
    await Statement.findByIdAndUpdate(statementId, {
      status: 'extracted',
      ocrProvider,
      extractedData: {
        rawText: extractedText,
        parsedData: statementData,
        confidence,
      },
      extractedAt: new Date(),
    });

    // Persist transactions with dedupe
    if (statementData.transactions && statementData.transactions.length > 0) {
      await createTransactionsFromOCR(statementId, statementData.transactions);
    } else {
      await Statement.findByIdAndUpdate(statementId, {
        status: 'completed',
        transactionsFound: 0,
        transactionsImported: 0,
      });
    }
  } catch (error) {
    await Statement.findByIdAndUpdate(statementId, {
      status: 'failed',
      processingErrors: ['OCR processing failed: ' + (error as Error).message],
    });
  }
}

// Fallback PDF text extraction using pdfjs-dist (no native deps)
async function extractTextFromPdfWithPdfJs(buffer: Buffer): Promise<string> {
  const pdfjs: any = await import('pdfjs-dist');
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

async function createTransactionsFromOCR(
  statementId: string,
  extractedTransactions: ExtractedTransaction[]
): Promise<void> {
  const existingTransactions = await Transaction.find({ statement: statementId })
    .select('txnDate description amount direction')
    .lean();

  const existingSignatures = new Set(
    existingTransactions.map(t =>
      `${new Date(t.txnDate).toISOString().split('T')[0]}_${t.description}_${t.amount}_${t.direction}`
    )
  );

  const newTransactions: any[] = [];
  const currentYear = new Date().getFullYear();

  for (const extracted of extractedTransactions) {
    let txnDate: Date;
    const dateParts = extracted.date.split('/');
    if (dateParts.length === 2) {
      const [month, day] = dateParts;
      txnDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
    } else if (dateParts.length === 3) {
      const [month, day, year] = dateParts;
      const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
      txnDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    } else {
      continue;
    }

    const signature = `${txnDate.toISOString().split('T')[0]}_${extracted.description}_${extracted.amount}_${extracted.type}`;
    if (existingSignatures.has(signature)) continue;

    newTransactions.push({
      statement: new Types.ObjectId(statementId),
      txnDate,
      description: extracted.description,
      amount: extracted.amount,
      direction: extracted.type,
      balance: extracted.balance,
      confidence: 0.8,
    });
  }

  if (newTransactions.length > 0) {
    await Transaction.insertMany(newTransactions);
    await Statement.findByIdAndUpdate(statementId, {
      status: 'completed',
      $inc: {
        transactionsFound: extractedTransactions.length,
        transactionsImported: newTransactions.length,
      },
    });
  }
}


