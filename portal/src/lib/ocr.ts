import vision from '@google-cloud/vision';
import Tesseract from 'tesseract.js';

interface OCRResult {
  text: string;
  confidence?: number;
  provider: 'google-vision' | 'tesseract';
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

class OCRService {
  private googleVisionClient: vision.ImageAnnotatorClient | null = null;

  constructor() {
    // Initialize Google Vision client if credentials are available
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_PROJECT_ID) {
      try {
        this.googleVisionClient = new vision.ImageAnnotatorClient({
          projectId: process.env.GOOGLE_PROJECT_ID,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
      } catch (error) {
        console.warn('Google Vision client initialization failed, will use Tesseract as fallback:', error);
      }
    }
  }

  async extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    // Try Google Vision first if available
    if (this.googleVisionClient) {
      try {
        const result = await this.extractWithGoogleVision(imageBuffer);
        return result;
      } catch (error) {
        console.error('Google Vision OCR failed, falling back to Tesseract:', error);
      }
    }

    // Fallback to Tesseract
    return await this.extractWithTesseract(imageBuffer, mimeType);
  }

  private async extractWithGoogleVision(imageBuffer: Buffer): Promise<OCRResult> {
    if (!this.googleVisionClient) {
      throw new Error('Google Vision client not initialized');
    }

    try {
      const [result] = await this.googleVisionClient.documentTextDetection({
        image: {
          content: imageBuffer.toString('base64'),
        },
      });

      const fullText = result.fullTextAnnotation?.text || '';
      
      // Calculate confidence from Google Vision response
      let confidence = 0;
      if (result.fullTextAnnotation?.pages?.[0]?.confidence) {
        confidence = result.fullTextAnnotation.pages[0].confidence;
      }

      return {
        text: fullText,
        confidence,
        provider: 'google-vision',
      };
    } catch (error: any) {
      throw new Error(`Google Vision OCR failed: ${error.message}`);
    }
  }

  private async extractWithTesseract(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    try {
      // Convert buffer to base64 data URL for Tesseract
      const base64 = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const result = await Tesseract.recognize(
        dataUrl,
        'eng',
        {
          logger: (info) => {
            if (info.status === 'recognizing text') {
              console.log(`Tesseract progress: ${Math.round(info.progress * 100)}%`);
            }
          },
        }
      );

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        provider: 'tesseract',
      };
    } catch (error: any) {
      throw new Error(`Tesseract OCR failed: ${error.message}`);
    }
  }

  parseBankStatement(ocrText: string): BankStatementData {
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const transactions: ExtractedTransaction[] = [];
    
    let accountNumber: string | undefined;
    let bankName: string | undefined;
    let period: string | undefined;
    let openingBalance: number | undefined;
    let closingBalance: number | undefined;

    // Common bank name patterns
    const bankPatterns = [
      /chase/i,
      /bank of america/i,
      /wells fargo/i,
      /citibank/i,
      /capital one/i,
      /pnc/i,
      /td bank/i,
      /us bank/i,
    ];

    // Parse each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract bank name
      if (!bankName) {
        for (const pattern of bankPatterns) {
          if (pattern.test(line)) {
            bankName = line.match(pattern)?.[0] || undefined;
            break;
          }
        }
      }

      // Extract account number
      if (!accountNumber && /account\s*(?:number|#)?[\s:]*(\d{4,})/i.test(line)) {
        const match = line.match(/account\s*(?:number|#)?[\s:]*(\d{4,})/i);
        if (match) accountNumber = match[1];
      }

      // Extract period
      if (!period && /statement\s*period|period\s*ending|for\s*(?:the\s*)?month/i.test(line)) {
        period = line;
      }

      // Extract balances
      if (/opening\s*balance|beginning\s*balance|previous\s*balance/i.test(line)) {
        const match = line.match(/[\$\s]*([\d,]+\.?\d*)/);
        if (match) openingBalance = parseFloat(match[1].replace(/,/g, ''));
      }

      if (/closing\s*balance|ending\s*balance|new\s*balance/i.test(line)) {
        const match = line.match(/[\$\s]*([\d,]+\.?\d*)/);
        if (match) closingBalance = parseFloat(match[1].replace(/,/g, ''));
      }

      // Extract transactions (common patterns)
      // Pattern: MM/DD or MM/DD/YY followed by description and amount
      const transactionPattern = /^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+?)\s+([\d,]+\.?\d{2})\s*([+-]?)/;
      const match = line.match(transactionPattern);
      
      if (match) {
        const [, date, description, amountStr, sign] = match;
        const amount = parseFloat(amountStr.replace(/,/g, ''));
        
        // Determine if debit or credit based on sign or keywords
        let type: 'debit' | 'credit' = 'debit';
        if (sign === '+' || /deposit|credit|payment\s+received/i.test(description)) {
          type = 'credit';
        } else if (sign === '-' || /withdrawal|debit|payment|purchase/i.test(description)) {
          type = 'debit';
        }

        transactions.push({
          date,
          description: description.trim(),
          amount,
          type,
        });
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
export const ocrService = new OCRService();

// Export types
export type { OCRResult, ExtractedTransaction, BankStatementData };