import { createWorker, PSM, OEM } from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

interface OCRResult {
  text: string;
  confidence?: number;
  provider: 'tesseract' | 'pdf-parse' | 'pdfjs-dist' | 'none';
  error?: string;
}

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance?: number;
}

interface BankStatementData {
  accountNumber?: string;
  bankName?: string;
  period?: string;
  transactions: ExtractedTransaction[];
  totalDebits?: number;
  totalCredits?: number;
  openingBalance?: number;
  closingBalance?: number;
}

/**
 * Enhanced OCR Service using Tesseract.js
 * This provides free, local OCR processing without requiring API keys
 */
class TesseractOCRService {
  private worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing Tesseract.js worker...');
      this.worker = await createWorker('eng', OEM.LSTM_ONLY, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`Tesseract progress: ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
      });

      // Configure for better bank statement recognition
      await this.worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/$-+() ',
      });

      this.isInitialized = true;
      console.log('Tesseract.js initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Tesseract.js:', error);
      throw error;
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  /**
   * Extract text from a PDF by converting pages to images first
   */
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<OCRResult> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ocr-pdf-'));
    const tempPdfPath = path.join(tempDir, 'input.pdf');
    
    try {
      // First try to extract embedded text with pdf-parse
      try {
        const pdfParse = require('pdf-parse');
        const pdfResult = await pdfParse(pdfBuffer);
        
        // If we get substantial text, use it
        if (pdfResult.text && pdfResult.text.trim().length > 100) {
          console.log('PDF has embedded text, using pdf-parse');
          await fs.rmdir(tempDir, { recursive: true });
          return {
            text: pdfResult.text,
            provider: 'pdf-parse',
          };
        }
      } catch (error) {
        console.log('pdf-parse failed or no embedded text, will use OCR');
      }

      // Save PDF to temporary file
      await fs.writeFile(tempPdfPath, pdfBuffer);

      // Convert PDF to images
      console.log('Converting PDF to images for OCR...');
      const convert = fromPath(tempPdfPath, {
        density: 200,
        saveFilename: 'page',
        savePath: tempDir,
        format: 'png',
        width: 2480,
        height: 3508,
      });

      // Get the number of pages
      const pdfParse = require('pdf-parse');
      const pdfInfo = await pdfParse(pdfBuffer);
      const numPages = Math.min(pdfInfo.numpages || 1, 10); // Process max 10 pages

      // Initialize Tesseract if needed
      await this.initialize();

      let fullText = '';
      let totalConfidence = 0;
      let processedPages = 0;

      // Process each page
      for (let i = 1; i <= numPages; i++) {
        try {
          console.log(`Processing page ${i}/${numPages}...`);
          
          // Convert page to image
          const image = await convert(i);
          
          if (image?.path && this.worker) {
            // Perform OCR on the image
            const result = await this.worker.recognize(image.path);
            
            if (result.data.text) {
              fullText += result.data.text + '\n\n';
              totalConfidence += result.data.confidence;
              processedPages++;
            }
            
            // Clean up the image file
            await fs.unlink(image.path).catch(() => {});
          }
        } catch (error) {
          console.error(`Error processing page ${i}:`, error);
        }
      }

      // Clean up temp directory
      await fs.rmdir(tempDir, { recursive: true }).catch(() => {});

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('No text could be extracted from PDF');
      }

      return {
        text: fullText,
        confidence: processedPages > 0 ? totalConfidence / processedPages : 0,
        provider: 'tesseract',
      };

    } catch (error: any) {
      // Clean up on error
      await fs.rmdir(tempDir, { recursive: true }).catch(() => {});
      
      console.error('PDF OCR failed:', error);
      return {
        text: '',
        provider: 'tesseract',
        error: `PDF OCR failed: ${error.message}`,
      };
    }
  }

  /**
   * Extract text from an image using Tesseract.js
   */
  async extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    try {
      // Handle PDFs separately
      if (mimeType === 'application/pdf') {
        return await this.extractTextFromPDF(imageBuffer);
      }

      // Initialize Tesseract if needed
      await this.initialize();

      if (!this.worker) {
        throw new Error('Tesseract worker not initialized');
      }

      console.log('Performing OCR on image...');
      
      // Create a temporary file for the image
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ocr-img-'));
      const extension = mimeType.split('/')[1] || 'png';
      const tempImagePath = path.join(tempDir, `image.${extension}`);
      
      // Save image to temporary file
      await fs.writeFile(tempImagePath, imageBuffer);

      // Perform OCR
      const result = await this.worker.recognize(tempImagePath);
      
      // Clean up temp file
      await fs.rmdir(tempDir, { recursive: true }).catch(() => {});

      if (!result.data.text || result.data.text.trim().length === 0) {
        throw new Error('No text detected in image');
      }

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        provider: 'tesseract',
      };

    } catch (error: any) {
      console.error('Image OCR failed:', error);
      return {
        text: '',
        provider: 'tesseract',
        error: `Image OCR failed: ${error.message}`,
      };
    }
  }

  /**
   * Parse bank statement text to extract structured data
   */
  parseBankStatement(ocrText: string): BankStatementData {
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const transactions: ExtractedTransaction[] = [];
    
    let accountNumber: string | undefined;
    let bankName: string | undefined;
    let period: string | undefined;
    let openingBalance: number | undefined;
    let closingBalance: number | undefined;

    // Enhanced bank name patterns
    const bankPatterns = [
      /chase/i,
      /bank of america/i,
      /wells fargo/i,
      /citibank/i,
      /capital one/i,
      /pnc/i,
      /td bank/i,
      /us bank/i,
      /jpmorgan/i,
      /truist/i,
      /fifth third/i,
      /huntington/i,
      /regions bank/i,
      /keybank/i,
      /citizens bank/i,
      /m&t bank/i,
      /ally bank/i,
      /discover bank/i,
      /synchrony/i,
      /american express/i,
    ];

    // Transaction patterns - more flexible to handle various formats
    const transactionPatterns = [
      // Standard: MM/DD or MM/DD/YY or MM/DD/YYYY followed by description and amount
      /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+([\d,]+\.?\d{2})\s*([+-]?)/,
      // With balance: date, description, amount, balance
      /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+([\d,]+\.?\d{2})\s+([\d,]+\.?\d{2})/,
      // Alternative format: date at end
      /(.+?)\s+([\d,]+\.?\d{2})\s*([+-]?)\s*(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/,
      // Amount with dollar sign
      /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+\$([\d,]+\.?\d{2})/,
    ];

    // Parse each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';

      // Extract bank name
      if (!bankName) {
        for (const pattern of bankPatterns) {
          if (pattern.test(line)) {
            const match = line.match(pattern);
            if (match) {
              bankName = match[0];
              break;
            }
          }
        }
      }

      // Extract account number (various formats)
      if (!accountNumber) {
        // Standard account number patterns
        const accountPatterns = [
          /account\s*(?:number|#|no\.?)[\s:]*(\*+\d{4}|\d{4,})/i,
          /acct\s*(?:number|#|no\.?)[\s:]*(\*+\d{4}|\d{4,})/i,
          /account[\s:]+ending\s+in\s+(\d{4})/i,
          /\*{4,}(\d{4})/,  // Masked account number
        ];

        for (const pattern of accountPatterns) {
          const match = line.match(pattern);
          if (match) {
            accountNumber = match[1];
            break;
          }
        }
      }

      // Extract period
      if (!period) {
        const periodPatterns = [
          /statement\s*period[\s:]+(.+)/i,
          /period\s*ending[\s:]+(.+)/i,
          /for\s*(?:the\s*)?(?:month|period)\s*(?:of\s*)?(.+)/i,
          /(\w+\s+\d{1,2},?\s*\d{4}\s*-\s*\w+\s+\d{1,2},?\s*\d{4})/,
        ];

        for (const pattern of periodPatterns) {
          const match = line.match(pattern);
          if (match) {
            period = match[1].trim();
            break;
          }
        }
      }

      // Extract balances
      if (/opening\s*balance|beginning\s*balance|previous\s*balance|balance\s*forward/i.test(line)) {
        const match = line.match(/\$?([\d,]+\.?\d*)/);
        if (match) openingBalance = parseFloat(match[1].replace(/,/g, ''));
      }

      if (/closing\s*balance|ending\s*balance|new\s*balance|current\s*balance/i.test(line)) {
        const match = line.match(/\$?([\d,]+\.?\d*)/);
        if (match) closingBalance = parseFloat(match[1].replace(/,/g, ''));
      }

      // Extract transactions
      for (const pattern of transactionPatterns) {
        const match = line.match(pattern);
        
        if (match) {
          let date: string, description: string, amountStr: string, sign: string = '';
          
          // Handle different capture group arrangements
          if (pattern.source.includes('(.+?)\\s+(')) {
            // Alternative format (description at start)
            [, description, amountStr, sign, date] = match;
          } else {
            // Standard format (date at start)
            [, date, description, amountStr, sign] = match;
          }

          // Clean up values
          date = date?.trim();
          description = description?.trim();
          const amount = parseFloat(amountStr.replace(/[$,]/g, ''));

          // Skip if invalid
          if (!date || !description || isNaN(amount)) continue;

          // Determine transaction type
          let type: 'debit' | 'credit' = 'debit';
          
          // Check sign
          if (sign === '+') {
            type = 'credit';
          } else if (sign === '-') {
            type = 'debit';
          } else {
            // Check description keywords
            const creditKeywords = /deposit|credit|payment\s+received|refund|transfer\s+in|interest/i;
            const debitKeywords = /withdrawal|debit|payment|purchase|fee|charge|transfer\s+out/i;
            
            if (creditKeywords.test(description)) {
              type = 'credit';
            } else if (debitKeywords.test(description)) {
              type = 'debit';
            }
          }

          // Check if this looks like a real transaction (not a header or total)
          if (!/total|balance|summary|page/i.test(description) && amount > 0) {
            transactions.push({
              date,
              description: description.substring(0, 200), // Limit description length
              amount,
              type,
            });
          }
          
          break; // Only match one pattern per line
        }
      }
    }

    // Calculate totals
    const totalDebits = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalCredits = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      accountNumber,
      bankName,
      period,
      transactions,
      totalDebits,
      totalCredits,
      openingBalance,
      closingBalance,
    };
  }
}

// Export singleton instance
export const tesseractOCRService = new TesseractOCRService();

// Export types
export type { OCRResult, ExtractedTransaction, BankStatementData };