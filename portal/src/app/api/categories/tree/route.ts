import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/categories/tree - Get category tree structure
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // income, expense, transfer

    let query: any = { status: 'active' };
    
    if (type) {
      query.type = type;
    }

    const categories = await Category.find(query)
      .sort({ type: 1, sortOrder: 1, name: 1 })
      .lean();

    // Build tree structure grouped by type
    const tree = buildCategoryTreeByType(categories);

    return NextResponse.json({ tree });
  } catch (error: any) {
    console.error('Error fetching category tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category tree', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to build category tree grouped by type
function buildCategoryTreeByType(categories: any[]): any {
  const incomeCategories: any[] = [];
  const expenseCategories: any[] = [];
  const transferCategories: any[] = [];

  const categoryMap = new Map();

  // First pass: create map of all categories
  categories.forEach(cat => {
    categoryMap.set(cat._id.toString(), {
      id: cat._id,
      name: cat.name,
      type: cat.type,
      description: cat.description,
      isDeductible: cat.isDeductible,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
      children: [],
    });
  });

  // Second pass: build tree structure
  categories.forEach(cat => {
    const category = categoryMap.get(cat._id.toString());
    
    if (cat.parentCategory) {
      const parentId = cat.parentCategory._id?.toString() || cat.parentCategory.toString();
      const parent = categoryMap.get(parentId);
      if (parent) {
        parent.children.push(category);
      } else {
        // Parent not found, add as root
        addToTypeArray(category, incomeCategories, expenseCategories, transferCategories);
      }
    } else {
      // No parent, add as root
      addToTypeArray(category, incomeCategories, expenseCategories, transferCategories);
    }
  });

  return {
    income: incomeCategories,
    expense: expenseCategories,
    transfer: transferCategories,
  };
}

function addToTypeArray(
  category: any,
  incomeArr: any[],
  expenseArr: any[],
  transferArr: any[]
) {
  switch (category.type) {
    case 'income':
      incomeArr.push(category);
      break;
    case 'expense':
      expenseArr.push(category);
      break;
    case 'transfer':
      transferArr.push(category);
      break;
  }
}

