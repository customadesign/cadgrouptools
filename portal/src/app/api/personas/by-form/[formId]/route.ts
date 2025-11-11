import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Persona from '@/models/Persona';

// GET /api/personas/by-form/[formId] - Get active persona for form
export async function GET(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    await connectToDatabase();

    const persona = await Persona.findOne({
      ghlFormId: params.formId,
      isActive: true,
    }).lean();

    if (!persona) {
      return NextResponse.json({ persona: null });
    }

    return NextResponse.json({ persona });
  } catch (error: any) {
    console.error('Error fetching persona by form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona', message: error.message },
      { status: 500 }
    );
  }
}

