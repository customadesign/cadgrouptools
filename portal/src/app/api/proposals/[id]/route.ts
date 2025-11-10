import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Proposal } from '@/models/Proposal';
import ManusTask from '@/models/ManusTask';
import GoHighLevelSubmission from '@/models/GoHighLevelSubmission';
import { requireAuth } from '@/lib/auth';

// GET /api/proposals/[id] - Get proposal details
export const GET = requireAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await connectToDatabase();

    const proposal = await Proposal.findById(params.id)
      .populate('client', 'organization website email phone')
      .lean();

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Get associated Manus task
    const manusTask = await ManusTask.findOne({ proposalId: params.id }).lean();

    // Get GHL submission if it exists
    const ghlSubmission = await GoHighLevelSubmission.findOne({ 
      proposalId: params.id 
    }).lean();

    // Enrich proposal with related data
    const enrichedProposal = {
      ...proposal,
      manusTask: manusTask || null,
      ghlSubmission: ghlSubmission || null,
      googleSlidesUrl: proposal.pdfKey || manusTask?.outputData?.slides_url || manusTask?.outputData?.presentation_url,
    };

    return NextResponse.json({ proposal: enrichedProposal });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
});

// PATCH /api/proposals/[id] - Update proposal
export const PATCH = requireAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    await connectToDatabase();

    const proposal = await Proposal.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('client', 'organization website email phone');

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    );
  }
});

// DELETE /api/proposals/[id] - Delete proposal
export const DELETE = requireAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await connectToDatabase();

    const proposal = await Proposal.findByIdAndDelete(params.id);

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to delete proposal' },
      { status: 500 }
    );
  }
});
