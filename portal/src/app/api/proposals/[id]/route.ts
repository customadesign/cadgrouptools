import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Proposal } from '@/models/Proposal';
import { requireAuth, requireRole } from '@/lib/auth';

// GET /api/proposals/[id] - Get a single proposal
export const GET = requireAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;

    await connectToDatabase();

    const proposal = await Proposal.findById(id)
      .populate('client', 'organization website industry email phone address');
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
});

// PUT /api/proposals/[id] - Update a proposal
export const PUT = requireAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      status,
      selectedServices,
      murphyRate,
      clientRate,
      researchJson,
      htmlDraft,
      pdfKey,
    } = body;

    // Validation
    if (status && !['draft', 'finalized', 'sent'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    if (selectedServices !== undefined) {
      if (!Array.isArray(selectedServices) || selectedServices.length === 0) {
        return NextResponse.json(
          { error: 'At least one service must be selected' },
          { status: 400 }
        );
      }
    }

    // Validate rates
    if (murphyRate !== undefined && (murphyRate < 0 || !Number.isFinite(murphyRate))) {
      return NextResponse.json(
        { error: 'Invalid Murphy rate' },
        { status: 400 }
      );
    }

    if (clientRate !== undefined && (clientRate < 0 || !Number.isFinite(clientRate))) {
      return NextResponse.json(
        { error: 'Invalid client rate' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if proposal exists
    const existingProposal = await Proposal.findById(id);
    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Prevent editing finalized proposals unless changing status
    if (existingProposal.status === 'finalized' && !status && status !== 'sent') {
      const editableFields = ['status', 'pdfKey'];
      const attemptedEdits = Object.keys(body).filter(key => !editableFields.includes(key));
      if (attemptedEdits.length > 0) {
        return NextResponse.json(
          { error: 'Cannot edit finalized proposal content. Only status and PDF can be updated.' },
          { status: 400 }
        );
      }
    }

    // Update proposal
    const updatedProposal = await Proposal.findByIdAndUpdate(
      id,
      {
        ...(status !== undefined && { status }),
        ...(selectedServices !== undefined && { selectedServices }),
        ...(murphyRate !== undefined && { murphyRate }),
        ...(clientRate !== undefined && { clientRate }),
        ...(researchJson !== undefined && { researchJson }),
        ...(htmlDraft !== undefined && { htmlDraft }),
        ...(pdfKey !== undefined && { pdfKey }),
      },
      { new: true, runValidators: true }
    ).populate('client', 'organization website industry email phone address');

    return NextResponse.json({ proposal: updatedProposal });
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    );
  }
});

// DELETE /api/proposals/[id] - Delete a proposal (admin only)
export const DELETE = requireRole('admin')(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;

    await connectToDatabase();

    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of sent proposals
    if (proposal.status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot delete sent proposals' },
        { status: 400 }
      );
    }

    await Proposal.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to delete proposal' },
      { status: 500 }
    );
  }
});