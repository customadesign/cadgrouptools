import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import AccountingDocument from '@/models/AccountingDocument';
import { requireAuth } from '@/lib/auth';
import claudeService from '@/services/claudeService';

// POST /api/accounting/chat - Send message to Claude
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { message, context, conversationHistory } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Enrich context with recent data if company is specified
    let enrichedContext = { ...context };

    if (context?.company) {
      // Get recent documents
      const recentDocs = await AccountingDocument.find({
        company: context.company,
        processingStatus: 'completed',
      })
        .sort({ year: -1, createdAt: -1 })
        .limit(3)
        .lean();

      enrichedContext.recentDocuments = recentDocs;

      // Get latest P&L from most recent completed document
      if (recentDocs.length > 0 && recentDocs[0].analysisResult?.plStatement) {
        enrichedContext.latestPL = {
          month: recentDocs[0].month,
          year: recentDocs[0].year,
          ...recentDocs[0].analysisResult.plStatement,
        };
      }
    }

    // Call Claude service
    const response = await claudeService.sendMessage(
      message,
      enrichedContext,
      conversationHistory || []
    );

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error in accounting chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', message: error.message },
      { status: 500 }
    );
  }
});

