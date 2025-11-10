import Anthropic from '@anthropic-ai/sdk';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AccountingContext {
  company?: string;
  companyName?: string;
  recentDocuments?: any[];
  latestPL?: any;
  accountBalance?: number;
  currentPage?: string;
}

class ClaudeService {
  private client: Anthropic;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('ANTHROPIC_API_KEY not set - Claude chat will not work');
    }

    this.client = new Anthropic({
      apiKey: this.apiKey,
    });
  }

  /**
   * Send a message to Claude with accounting context
   */
  async sendMessage(
    userMessage: string,
    context: AccountingContext,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Build context string
      const contextString = this.buildContextString(context);

      // Build messages array
      const messages: any[] = [
        {
          role: 'user',
          content: contextString,
        },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      // Call Claude API
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages,
        system: `You are an accounting assistant for CAD Group Management internal tools. 
You have access to financial data for multiple companies and can help answer questions about:
- Financial statements and P&L analysis
- Transaction history and patterns
- Cash flow and balances
- Expense categorization
- Month-over-month and year-over-year comparisons
- Financial insights and recommendations

Be concise, professional, and data-driven in your responses. Always cite specific numbers from the provided context when available.`,
      });

      // Extract the response text
      const assistantMessage = response.content[0];
      if (assistantMessage.type === 'text') {
        return assistantMessage.text;
      }

      return 'Unable to generate response';

    } catch (error: any) {
      console.error('Error calling Claude API:', error);
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Stream a message to Claude with accounting context (for real-time responses)
   */
  async *streamMessage(
    userMessage: string,
    context: AccountingContext,
    conversationHistory: ChatMessage[] = []
  ): AsyncGenerator<string> {
    try {
      const contextString = this.buildContextString(context);

      const messages: any[] = [
        {
          role: 'user',
          content: contextString,
        },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const stream = await this.client.messages.stream({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages,
        system: `You are an accounting assistant for CAD Group Management internal tools.`,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && 
            chunk.delta.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }

    } catch (error: any) {
      console.error('Error streaming from Claude:', error);
      throw new Error(`Claude streaming error: ${error.message}`);
    }
  }

  /**
   * Build context string from accounting data
   */
  private buildContextString(context: AccountingContext): string {
    let contextParts: string[] = [];

    if (context.companyName) {
      contextParts.push(`You are currently helping with: ${context.companyName}`);
    }

    if (context.latestPL) {
      contextParts.push(`Latest P&L (${context.latestPL.month} ${context.latestPL.year}):
- Revenue: $${context.latestPL.totalRevenue?.toLocaleString() || 0}
- Expenses: $${context.latestPL.totalExpenses?.toLocaleString() || 0}
- Net Income: $${context.latestPL.netIncome?.toLocaleString() || 0}`);
    }

    if (context.recentDocuments && context.recentDocuments.length > 0) {
      contextParts.push(`Recent documents uploaded:`);
      context.recentDocuments.forEach((doc, i) => {
        contextParts.push(`${i + 1}. ${doc.documentType} - ${doc.month} ${doc.year} (${doc.processingStatus})`);
      });
    }

    if (context.accountBalance !== undefined) {
      contextParts.push(`Current account balance: $${context.accountBalance.toLocaleString()}`);
    }

    if (context.currentPage) {
      contextParts.push(`User is currently on: ${context.currentPage}`);
    }

    if (contextParts.length === 0) {
      return 'No specific accounting context available. Ready to answer general accounting questions.';
    }

    return `Context:\n${contextParts.join('\n')}`;
  }

  /**
   * Get quick question suggestions based on context
   */
  getQuickQuestions(context: AccountingContext): string[] {
    const questions: string[] = [];

    if (context.latestPL) {
      questions.push(`What are the key insights from ${context.latestPL.month} ${context.latestPL.year}?`);
      questions.push('How does this month compare to last month?');
    }

    if (context.company) {
      questions.push('What are the major expense categories?');
      questions.push('Show me the cash flow trend');
      questions.push('What unusual transactions should I review?');
    }

    questions.push('Explain my P&L statement');
    questions.push('What should I focus on this month?');

    return questions.slice(0, 5); // Return max 5 suggestions
  }
}

// Export singleton instance
export default new ClaudeService();

