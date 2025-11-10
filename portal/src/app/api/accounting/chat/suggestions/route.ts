import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import claudeService from '@/services/claudeService';

// POST /api/accounting/chat/suggestions - Get quick question suggestions
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { context } = body;

    const questions = claudeService.getQuickQuestions(context || {});

    return NextResponse.json({
      questions,
    });

  } catch (error: any) {
    console.error('Error getting suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions', message: error.message },
      { status: 500 }
    );
  }
});

