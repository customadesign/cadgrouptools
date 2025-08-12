import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Proposal } from '@/models/Proposal';
import { Client } from '@/models/Client';
import { requireAuth } from '@/lib/auth';

// GET /api/proposals - List all proposals
export const GET = requireAuth(async (request: NextRequest) => {
  try {
    await connectToDatabase();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const clientId = searchParams.get('clientId') || '';

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (clientId) {
      query.client = clientId;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .populate('client', 'organization website industry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Proposal.countDocuments(query),
    ]);

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
});

// POST /api/proposals - Create a new proposal
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      clientId,
      selectedServices,
      murphyRate,
      clientRate,
      researchJson,
      htmlDraft,
    } = body;

    // Validation
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!selectedServices || !Array.isArray(selectedServices) || selectedServices.length === 0) {
      return NextResponse.json(
        { error: 'At least one service must be selected' },
        { status: 400 }
      );
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

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Create proposal
    const proposal = await Proposal.create({
      client: clientId,
      selectedServices,
      murphyRate,
      clientRate,
      researchJson,
      htmlDraft,
      status: 'draft',
    });

    // Populate client data before returning
    await proposal.populate('client', 'organization website industry');

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
});