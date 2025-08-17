import { tesseractOCRService } from './ocr-tesseract';

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
 * Server-side OCR Service
 * This version uses Tesseract.js for all OCR processing
 * Optimized for server environments like Render
 */
class ServerOCRService {
  constructor() {
    console.log('OCR Service initialized with Tesseract.js');
  }

  async extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    // Delegate all OCR processing to Tesseract service
    return await tesseractOCRService.extractTextFromImage(imageBuffer, mimeType);
  }

  parseBankStatement(ocrText: string): BankStatementData {
    // Use the Tesseract service's parser which has enhanced patterns
    return tesseractOCRService.parseBankStatement(ocrText);
  }
}

// Export singleton instance
export const ocrService = new ServerOCRService();

// Export types
export type { OCRResult, ExtractedTransaction, BankStatementData };