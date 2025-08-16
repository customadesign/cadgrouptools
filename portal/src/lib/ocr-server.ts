import vision from '@google-cloud/vision';

interface OCRResult {
  text: string;
  confidence?: number;
  provider: 'google-vision' | 'tesseract' | 'pdf-parse' | 'none';
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
 * This version is optimized for server environments like Render
 * It prioritizes Google Vision API and falls back to PDF text extraction
 * Tesseract.js is not used server-side as it requires browser environment
 */
class ServerOCRService {
  private googleVisionClient: vision.ImageAnnotatorClient | null = null;

  constructor() {
    // Initialize Google Vision client if credentials are available
    const hasGoogleCreds = process.env.GOOGLE_PROJECT_ID || 
                           process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                           process.env.GOOGLE_VISION_API_KEY;
    
    if (hasGoogleCreds) {
      try {
        // Try different authentication methods
        const authOptions: any = {};
        
        if (process.env.GOOGLE_PROJECT_ID) {
          authOptions.projectId = process.env.GOOGLE_PROJECT_ID;
        }
        
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          // If it's a path to a file
          if (process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('/') || 
              process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('./')) {
            authOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
          } else {
            // If it's JSON content directly
            try {
              const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
              authOptions.credentials = credentials;
            } catch (e) {
              console.warn('Could not parse GOOGLE_APPLICATION_CREDENTIALS as JSON');
            }
          }
        }
        
        if (process.env.GOOGLE_VISION_API_KEY) {
          authOptions.apiKey = process.env.GOOGLE_VISION_API_KEY;
        }
        
        this.googleVisionClient = new vision.ImageAnnotatorClient(authOptions);
        console.log('Google Vision client initialized successfully');
      } catch (error) {
        console.warn('Google Vision client initialization failed:', error);
        console.log('OCR will fall back to basic text extraction for PDFs only');
      }
    } else {
      console.log('Google Vision credentials not found. OCR will only work for PDFs with embedded text.');
    }
  }

  async extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    // For PDFs, we rely on pdf-parse/pdfjs-dist in processStatement.ts
    if (mimeType === 'application/pdf') {
      return {
        text: '',
        provider: 'pdf-parse',
        error: 'PDF should be processed by pdf-parse/pdfjs-dist'
      };
    }

    // Try Google Vision for images
    if (this.googleVisionClient) {
      try {
        return await this.extractWithGoogleVision(imageBuffer);
      } catch (error) {
        console.error('Google Vision OCR failed:', error);
      }
    }

    // If no OCR service is available for images, return an error
    return {
      text: '',
      provider: 'none',
      error: 'No OCR service available for images. Please configure Google Vision API or upload PDF files with embedded text.'
    };
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

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('No text detected in image');
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
export const ocrService = new ServerOCRService();

// Export types
export type { OCRResult, ExtractedTransaction, BankStatementData };