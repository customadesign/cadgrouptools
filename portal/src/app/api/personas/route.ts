import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Persona from '@/models/Persona';
import { requireAuth } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/personas - List personas
export const GET = requireAuth(async (request: NextRequest) => {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const company = searchParams.get('company');
    const formId = searchParams.get('formId');

    const query: any = {};
    if (company) {
      query.company = company;
    }
    if (formId) {
      query.ghlFormId = formId;
    }

    const personas = await Persona.find(query)
      .sort({ isActive: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json({ personas });
  } catch (error: any) {
    console.error('Error fetching personas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas', message: error.message },
      { status: 500 }
    );
  }
});

// POST /api/personas - Create persona
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { name, company, promptText, ghlFormId, ghlFormName, isActive } = body;

    // Validation
    if (!name || !company || !promptText || !ghlFormId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (promptText.length < 50) {
      return NextResponse.json(
        { error: 'Prompt must be at least 50 characters' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // If setting as active, deactivate others for this form
    if (isActive) {
      await Persona.updateMany(
        { ghlFormId },
        { isActive: false }
      );
    }

    const persona = await Persona.create({
      name,
      company,
      promptText,
      ghlFormId,
      ghlFormName: ghlFormName || '',
      isActive: isActive || false,
      createdBy: session?.user?.id,
    });

    await persona.populate('createdBy', 'name email');

    return NextResponse.json({ persona }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating persona:', error);
    return NextResponse.json(
      { error: 'Failed to create persona', message: error.message },
      { status: 500 }
    );
  }
});

