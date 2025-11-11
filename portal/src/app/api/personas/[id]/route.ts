import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Persona from '@/models/Persona';
import { requireAuth } from '@/lib/auth';

// GET /api/personas/[id] - Get persona details
export const GET = requireAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await connectToDatabase();

    const persona = await Persona.findById(params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ persona });
  } catch (error: any) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona', message: error.message },
      { status: 500 }
    );
  }
});

// PATCH /api/personas/[id] - Update persona
export const PATCH = requireAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    await connectToDatabase();

    const persona = await Persona.findById(params.id);
    
    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    // If activating this persona, deactivate others for the same form
    if (body.isActive && !persona.isActive) {
      await Persona.updateMany(
        {
          ghlFormId: persona.ghlFormId,
          _id: { $ne: params.id },
        },
        { isActive: false }
      );
    }

    // Update fields
    if (body.name !== undefined) persona.name = body.name;
    if (body.promptText !== undefined) persona.promptText = body.promptText;
    if (body.ghlFormId !== undefined) persona.ghlFormId = body.ghlFormId;
    if (body.ghlFormName !== undefined) persona.ghlFormName = body.ghlFormName;
    if (body.isActive !== undefined) persona.isActive = body.isActive;

    await persona.save();
    await persona.populate('createdBy', 'name email');

    return NextResponse.json({ persona });
  } catch (error: any) {
    console.error('Error updating persona:', error);
    return NextResponse.json(
      { error: 'Failed to update persona', message: error.message },
      { status: 500 }
    );
  }
});

// DELETE /api/personas/[id] - Delete persona
export const DELETE = requireAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await connectToDatabase();

    const persona = await Persona.findById(params.id);
    
    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    // Don't delete if active
    if (persona.isActive) {
      return NextResponse.json(
        { error: 'Cannot delete active persona. Please activate another persona first.' },
        { status: 400 }
      );
    }

    await Persona.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting persona:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona', message: error.message },
      { status: 500 }
    );
  }
});

