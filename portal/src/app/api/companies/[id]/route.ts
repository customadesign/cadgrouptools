import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Company } from '@/models/Company';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/companies/:id - Get company details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const company = await Company.findById(params.id).lean();

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error: any) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/companies/:id - Update company
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const updates: any = {};

    // Only allow specific fields to be updated
    const allowedFields = [
      'name',
      'legalName',
      'taxId',
      'currency',
      'fiscalYearEnd',
      'status',
      'address',
      'phone',
      'email',
      'logo',
      'description',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Check if slug is being updated and if it's unique
    if (body.slug) {
      const existing = await Company.findOne({ 
        slug: body.slug, 
        _id: { $ne: params.id } 
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Company with this slug already exists' },
          { status: 409 }
        );
      }
      updates.slug = body.slug;
    }

    const company = await Company.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error: any) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/:id - Soft delete company (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Soft delete by setting status to inactive
    const company = await Company.findByIdAndUpdate(
      params.id,
      { $set: { status: 'inactive' } },
      { new: true }
    );

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Company deactivated successfully',
      company 
    });
  } catch (error: any) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company', details: error.message },
      { status: 500 }
    );
  }
}


