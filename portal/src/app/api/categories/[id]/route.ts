import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { Transaction } from '@/models/Transaction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/categories/:id - Get category details
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

    const category = await Category.findById(params.id)
      .populate('parentCategory', 'name type')
      .lean();

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get subcategories
    const subcategories = await Category.find({ 
      parentCategory: params.id,
      status: 'active'
    }).sort({ sortOrder: 1, name: 1 }).lean();

    return NextResponse.json({ 
      category: {
        ...category,
        subcategories
      }
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/:id - Update category
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
      'description',
      'isDeductible',
      'birCategory',
      'icon',
      'sortOrder',
      'status',
      'parentCategory',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Check if category exists
    const existingCategory = await Category.findById(params.id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent modification of system categories' core properties
    if (existingCategory.isSystem && (body.name || body.type)) {
      return NextResponse.json(
        { error: 'Cannot modify name or type of system categories' },
        { status: 403 }
      );
    }

    // If parentCategory is being updated, validate it
    if (body.parentCategory !== undefined) {
      if (body.parentCategory) {
        const parent = await Category.findById(body.parentCategory);
        if (!parent) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 404 }
          );
        }
        if (parent.type !== existingCategory.type) {
          return NextResponse.json(
            { error: 'Parent category must have same type' },
            { status: 400 }
          );
        }
        // Prevent circular reference
        if (parent._id.toString() === params.id) {
          return NextResponse.json(
            { error: 'Category cannot be its own parent' },
            { status: 400 }
          );
        }
      }
    }

    const category = await Category.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('parentCategory', 'name type');

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/:id - Delete category if not system category
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

    const category = await Category.findById(params.id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of system categories
    if (category.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system categories' },
        { status: 403 }
      );
    }

    // Check if category is used by any transactions
    const transactionCount = await Transaction.countDocuments({
      $or: [
        { category: params.id },
        { subcategory: params.id }
      ]
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category',
          message: `Category is used by ${transactionCount} transaction(s). Please reassign these transactions first.`
        },
        { status: 409 }
      );
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({
      parentCategory: params.id
    });

    if (subcategoryCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category',
          message: `Category has ${subcategoryCount} subcategory(ies). Please delete or reassign subcategories first.`
        },
        { status: 409 }
      );
    }

    await Category.findByIdAndDelete(params.id);

    return NextResponse.json({ 
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category', details: error.message },
      { status: 500 }
    );
  }
}


