import Tesseract from 'tesseract.js';

interface OCRResult {
  text: string;
  confidence?: number;
  provider: 'tesseract';
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
  constructor() {
    console.log('OCR Service initialized with Tesseract.js');
  }

  async extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    return await this.extractWithTesseract(imageBuffer, mimeType);
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
      return {
        text: '',
        provider: 'tesseract',
        error: `Tesseract OCR failed: ${error.message}`,
      };
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