import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Company } from '@/models/Company';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/companies - List all companies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query: any = {};
    
    if (status) {
      query.status = status;
    } else if (!includeInactive) {
      query.status = 'active';
    }

    const companies = await Company.find(query)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ companies });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      legalName,
      slug,
      taxId,
      currency = 'PHP',
      fiscalYearEnd = 12,
      status = 'active',
      address,
      phone,
      email,
      logo,
      description,
    } = body;

    // Validate required fields
    if (!name || !legalName || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, legalName, slug' },
        { status: 400 }
      );
    }

    // Check if company with same slug already exists
    const existing = await Company.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: 'Company with this slug already exists' },
        { status: 409 }
      );
    }

    // Create company
    const company = await Company.create({
      name,
      legalName,
      slug,
      taxId,
      currency,
      fiscalYearEnd,
      status,
      address,
      phone,
      email,
      logo,
      description,
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Failed to create company', details: error.message },
      { status: 500 }
    );
  }
}


