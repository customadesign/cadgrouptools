import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Client } from '@/models/Client';
import { withStatelessAuth } from '@/lib/auth-stateless';

// GET /api/clients - List all clients
export const GET = withStatelessAuth(async (request: NextRequest) => {
  try {
    await connectToDatabase();

    // Parse query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { organization: { $regex: search, $options: 'i' } },
        { website: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (industry) {
      query.industry = industry;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [clients, total] = await Promise.all([
      Client.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Client.countDocuments(query),
    ]);

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
});

// POST /api/clients - Create a new client
export const POST = withStatelessAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { organization, website, industry, address, email, phone } = body;

    // Validation
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization name is required' },
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

    // Check for duplicate
    const existing = await Client.findOne({
      organization: { $regex: `^${organization}$`, $options: 'i' },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A client with this organization name already exists' },
        { status: 409 }
      );
    }

    // Create client
    const client = await Client.create({
      organization,
      website,
      industry,
      address,
      email,
      phone,
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
});