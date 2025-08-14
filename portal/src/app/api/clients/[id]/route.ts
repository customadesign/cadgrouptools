import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Client } from '@/models/Client';
import { requireAuth, requireRole } from '@/lib/auth';

// GET /api/clients/[id] - Get a single client
export const GET = requireAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;

    await connectToDatabase();

    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
});

// PUT /api/clients/[id] - Update a client
export const PUT = requireAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      organization, 
      website, 
      industry, 
      address, 
      email, 
      phone,
      avatar,
      firstName,
      lastName,
      jobTitle,
      status,
      companySize,
      notes,
      leadSource,
      estimatedValue,
      linkedin,
      twitter 
    } = body;

    // Validation
    if (organization !== undefined && !organization) {
      return NextResponse.json(
        { error: 'Organization name cannot be empty' },
        { status: 400 }
      );
    }

    // Email validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // URL validation if provided
    if (website) {
      try {
        new URL(website);
      } catch {
        return NextResponse.json(
          { error: 'Invalid website URL' },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    // Check if client exists
    const existingClient = await Client.findById(id);
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check for duplicate organization name if it's being changed
    if (organization && organization !== existingClient.organization) {
      const duplicate = await Client.findOne({
        _id: { $ne: id },
        organization: { $regex: `^${organization}$`, $options: 'i' },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Another client with this organization name already exists' },
          { status: 409 }
        );
      }
    }

    // Update client
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        ...(organization !== undefined && { organization }),
        ...(website !== undefined && { website }),
        ...(industry !== undefined && { industry }),
        ...(address !== undefined && { address }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(status !== undefined && { status }),
        ...(companySize !== undefined && { companySize }),
        ...(notes !== undefined && { notes }),
        ...(leadSource !== undefined && { leadSource }),
        ...(estimatedValue !== undefined && { estimatedValue }),
        ...(linkedin !== undefined && { linkedin }),
        ...(twitter !== undefined && { twitter }),
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ client: updatedClient });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
});

// DELETE /api/clients/[id] - Delete a client (admin only)
export const DELETE = requireRole('admin')(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;

    await connectToDatabase();

    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if client has associated proposals
    const { Proposal } = await import('@/models/Proposal');
    const hasProposals = await Proposal.exists({ clientRef: id });
    if (hasProposals) {
      return NextResponse.json(
        { error: 'Cannot delete client with existing proposals' },
        { status: 400 }
      );
    }

    await Client.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
});