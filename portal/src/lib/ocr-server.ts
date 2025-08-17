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
 * Supports both Google Vision API key and Service Account authentication
 * Falls back to PDF text extraction when Vision API is not available
 */
class ServerOCRService {
  private googleVisionClient: InstanceType<typeof vision.ImageAnnotatorClient> | null = null;
  private useApiKey: boolean = false;
  private apiKey: string | null = null;

  constructor() {
    // Check for Google Vision API Key first (simpler authentication method)
    if (process.env.GOOGLE_VISION_API_KEY) {
      this.apiKey = process.env.GOOGLE_VISION_API_KEY;
      this.useApiKey = true;
      console.log('Google Vision API initialized with API key');
      console.log('Project ID:', process.env.GOOGLE_PROJECT_ID || 'Not set (will use default)');
    } 
    // Otherwise, try Service Account authentication
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        const authOptions: any = {};
        
        if (process.env.GOOGLE_PROJECT_ID) {
          authOptions.projectId = process.env.GOOGLE_PROJECT_ID;
        }
        
        // Check if it's JSON content (for Render environment variables)
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS.trim().startsWith('{')) {
          try {
            const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
            authOptions.credentials = credentials;
            console.log('Using service account JSON from environment variable');
          } catch (e) {
            console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS as JSON:', e);
            throw new Error('Invalid service account JSON in GOOGLE_APPLICATION_CREDENTIALS');
          }
        } 
        // Otherwise treat as file path (for local development)
        else if (process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('/') || 
                 process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('./')) {
          authOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
          console.log('Using service account key file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
        } else {
          throw new Error('GOOGLE_APPLICATION_CREDENTIALS must be either JSON content or a file path');
        }
        
        this.googleVisionClient = new vision.ImageAnnotatorClient(authOptions);
        console.log('Google Vision client initialized with service account');
      } catch (error) {
        console.error('Google Vision service account initialization failed:', error);
        console.log('OCR will fall back to basic text extraction for PDFs only');
      }
    } else {
      console.log('No Google Vision credentials found.');
      console.log('Set either GOOGLE_VISION_API_KEY or GOOGLE_APPLICATION_CREDENTIALS');
      console.log('OCR will only work for PDFs with embedded text.');
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
    if (this.useApiKey && this.apiKey) {
      try {
        return await this.extractWithGoogleVisionAPIKey(imageBuffer);
      } catch (error) {
        console.error('Google Vision API Key OCR failed:', error);
      }
    } else if (this.googleVisionClient) {
      try {
        return await this.extractWithGoogleVisionServiceAccount(imageBuffer);
      } catch (error) {
        console.error('Google Vision Service Account OCR failed:', error);
      }
    }

    // If no OCR service is available for images, return an error
    return {
      text: '',
      provider: 'none',
      error: 'No OCR service available for images. Please configure Google Vision API (set GOOGLE_VISION_API_KEY or GOOGLE_APPLICATION_CREDENTIALS) or upload PDF files with embedded text.'
    };
  }

  /**
   * Extract text using Google Vision API Key authentication
   * This method makes direct REST API calls to Google Vision
   */
  private async extractWithGoogleVisionAPIKey(imageBuffer: Buffer): Promise<OCRResult> {
    if (!this.apiKey) {
      throw new Error('Google Vision API key not configured');
    }

    try {
      const base64Image = imageBuffer.toString('base64');
      
      // Construct the API URL
      const url = `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`;
      
      // Prepare the request body
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1
              }
            ]
          }
        ]
      };

      // Make the API call
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vision API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Extract text from response
      const fullTextAnnotation = data.responses?.[0]?.fullTextAnnotation;
      const fullText = fullTextAnnotation?.text || '';
      
      // Calculate confidence
      let confidence = 0;
      if (fullTextAnnotation?.pages?.[0]?.confidence) {
        confidence = fullTextAnnotation.pages[0].confidence;
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
      throw new Error(`Google Vision API Key OCR failed: ${error.message}`);
    }
  }

  /**
   * Extract text using Google Vision Service Account authentication
   * This method uses the Google Cloud client library
   */
  private async extractWithGoogleVisionServiceAccount(imageBuffer: Buffer): Promise<OCRResult> {
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
      throw new Error(`Google Vision Service Account OCR failed: ${error.message}`);
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