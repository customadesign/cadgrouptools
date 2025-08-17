import { NextRequest } from 'next/server';

export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance?: number;
}

export interface BankStatementData {
  accountNumber?: string;
  bankName?: string;
  period?: string;
  transactions: ExtractedTransaction[];
  totalDebits: number;
  totalCredits: number;
  openingBalance?: number;
  closingBalance?: number;
}

export interface OCRResult {
  text: string;
  confidence?: number;
  provider: string;
  error?: string;
}

export class ClaudeCodeOCRService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  }

  /**
   * Extract text from PDF using Claude Code through OpenRouter
   */
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<OCRResult> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      // Convert PDF to base64
      const base64PDF = pdfBuffer.toString('base64');

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cadgrouptools.onrender.com',
          'X-Title': 'CADGroup Internal Tools - OCR Service'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-5-sonnet-20241022',
          messages: [
            {
              role: 'system',
              content: `You are an expert at parsing bank statements and extracting transaction data. 
              
Your task is to analyze the provided bank statement and extract all transactions in a structured format.

IMPORTANT RULES:
1. Extract ALL transactions - do not limit to any specific number
2. Parse dates in MM/DD/YYYY format when possible
3. Identify transaction types (debit/credit) based on context
4. Extract opening and closing balances
5. Identify bank name and account information
6. Be thorough and accurate - don't skip any transactions

Return ONLY a JSON object with this exact structure:
{
  "accountNumber": "string or null",
  "bankName": "string or null", 
  "period": "string or null",
  "openingBalance": "number or null",
  "closingBalance": "number or null",
  "transactions": [
    {
      "date": "MM/DD/YYYY",
      "description": "string",
      "amount": number,
      "type": "debit" or "credit"
    }
  ]
}`
            },
            {
              role: 'user',
              content: `Please parse this bank statement and extract all transaction data. Here is the PDF content in base64 format:

${base64PDF}

Please analyze this statement thoroughly and extract ALL transactions you can find. Do not limit yourself to any specific number - extract every single transaction visible in the statement.`
            }
          ],
          max_tokens: 4000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from Claude');
      }

      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Claude response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      return {
        text: content,
        confidence: 0.95, // Claude Code is very reliable
        provider: 'claude-code',
      };

    } catch (error: any) {
      console.error('Claude Code OCR failed:', error);
      return {
        text: '',
        provider: 'claude-code',
        error: `Claude Code OCR failed: ${error.message}`,
      };
    }
  }

  /**
   * Parse bank statement text to extract structured data
   * This is a fallback method if the PDF parsing fails
   */
  parseBankStatement(ocrText: string): BankStatementData {
    try {
      // Try to extract JSON from the text
      const jsonMatch = ocrText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        // Validate and transform the data
        const transactions: ExtractedTransaction[] = (parsedData.transactions || []).map((tx: any) => ({
          date: tx.date || '',
          description: tx.description || '',
          amount: parseFloat(tx.amount) || 0,
          type: tx.type === 'credit' ? 'credit' : 'debit',
          balance: tx.balance ? parseFloat(tx.balance) : undefined,
        }));

        // Calculate totals
        const totalDebits = transactions
          .filter(t => t.type === 'debit')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalCredits = transactions
          .filter(t => t.type === 'credit')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          accountNumber: parsedData.accountNumber || undefined,
          bankName: parsedData.bankName || undefined,
          period: parsedData.period || undefined,
          openingBalance: parsedData.openingBalance ? parseFloat(parsedData.openingBalance) : undefined,
          closingBalance: parsedData.closingBalance ? parseFloat(parsedData.closingBalance) : undefined,
          transactions,
          totalDebits,
          totalCredits,
        };
      }

      // Fallback to empty result if no JSON found
      return {
        transactions: [],
        totalDebits: 0,
        totalCredits: 0,
      };

    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return {
        transactions: [],
        totalDebits: 0,
        totalCredits: 0,
      };
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { configured: boolean; missing: string[] } {
    const missing: string[] = [];
    
    if (!this.apiKey) {
      missing.push('OPENROUTER_API_KEY');
    }

    return {
      configured: missing.length === 0,
      missing,
    };
  }
}

// Export singleton instance
export const claudeCodeOCRService = new ClaudeCodeOCRService();
