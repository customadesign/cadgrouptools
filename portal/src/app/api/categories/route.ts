import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/categories - List all categories with optional hierarchy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // income, expense, transfer
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const hierarchy = searchParams.get('hierarchy') === 'true';

    let query: any = {};
    
    if (type) {
      query.type = type;
    }
    
    if (!includeInactive) {
      query.status = 'active';
    }

    const categories = await Category.find(query)
      .populate('parentCategory', 'name type')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // If hierarchy requested, structure as tree
    if (hierarchy) {
      const categoryTree = buildCategoryTree(categories);
      return NextResponse.json({ categories: categoryTree });
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category (admin only)
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
      type,
      parentCategory = null,
      description,
      isDeductible = true,
      birCategory,
      isSystem = false,
      icon,
      sortOrder = 0,
      status = 'active',
    } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['income', 'expense', 'transfer'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: income, expense, or transfer' },
        { status: 400 }
      );
    }

    // Check if category with same name and type already exists
    const existing = await Category.findOne({ name, type });
    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name and type already exists' },
        { status: 409 }
      );
    }

    // If parentCategory is provided, validate it exists and has same type
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
      }
      if (parent.type !== type) {
        return NextResponse.json(
          { error: 'Parent category must have same type' },
          { status: 400 }
        );
      }
    }

    // Create category
    const category = await Category.create({
      name,
      type,
      parentCategory,
      description,
      isDeductible,
      birCategory,
      isSystem,
      icon,
      sortOrder,
      status,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to build category tree
function buildCategoryTree(categories: any[]): any[] {
  const categoryMap = new Map();
  const tree: any[] = [];

  // First pass: create map of all categories
  categories.forEach(cat => {
    categoryMap.set(cat._id.toString(), {
      ...cat,
      children: [],
    });
  });

  // Second pass: build tree structure
  categories.forEach(cat => {
    const category = categoryMap.get(cat._id.toString());
    if (cat.parentCategory) {
      const parent = categoryMap.get(cat.parentCategory._id?.toString() || cat.parentCategory.toString());
      if (parent) {
        parent.children.push(category);
      } else {
        // Parent not found, add as root
        tree.push(category);
      }
    } else {
      // No parent, add as root
      tree.push(category);
    }
  });

  return tree;
}


