import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { claudeCodeOCRService } from '@/lib/ocr-claude';
import { tesseractOCRService } from '@/lib/ocr-tesseract';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Claude Code OCR configuration
    const claudeConfig = claudeCodeOCRService.getConfigStatus();
    
    // Check Tesseract OCR configuration
    const tesseractConfig = {
      configured: true, // Tesseract is always available as fallback
      missing: [],
    };

    return NextResponse.json({
      success: true,
      data: {
        claudeCode: {
          name: 'Claude Code OCR (OpenRouter)',
          configured: claudeConfig.configured,
          missing: claudeConfig.missing,
          description: 'AI-powered OCR using Claude 3.5 Sonnet for best accuracy',
          priority: 'primary',
        },
        tesseract: {
          name: 'Tesseract OCR',
          configured: tesseractConfig.configured,
          missing: tesseractConfig.missing,
          description: 'Open-source OCR engine as fallback',
          priority: 'fallback',
        },
        recommendations: claudeConfig.configured ? [] : [
          'Add OPENROUTER_API_KEY to your environment variables',
          'Get API key from https://openrouter.ai/',
          'Claude Code OCR will provide much better transaction extraction',
        ],
      },
    });

  } catch (error: any) {
    console.error('Error checking OCR status:', error);
    return NextResponse.json(
      { error: 'Failed to check OCR status', details: error.message },
      { status: 500 }
    );
  }
}
