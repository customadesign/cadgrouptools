import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import dayjs from 'dayjs';

// GET: Fetch category statistics and management
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const direction = searchParams.get('direction'); // 'debit', 'credit', or null for both

    // Build date filter
    let dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.txnDate = {};
      if (startDate) dateFilter.txnDate.$gte = new Date(startDate);
      if (endDate) dateFilter.txnDate.$lte = new Date(endDate);
    }

    // Add direction filter if specified
    if (direction && ['debit', 'credit'].includes(direction)) {
      dateFilter.direction = direction;
    }

    // Get all unique categories
    const allCategories = await Transaction.distinct('category', dateFilter);
    
    // Get category statistics
    const categoryStats = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            category: { $ifNull: ['$category', 'Uncategorized'] },
            direction: '$direction',
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id.category',
          stats: {
            $push: {
              direction: '$_id.direction',
              totalAmount: '$totalAmount',
              transactionCount: '$transactionCount',
              avgAmount: '$avgAmount',
              minAmount: '$minAmount',
              maxAmount: '$maxAmount',
            },
          },
        },
      },
      {
        $project: {
          category: '$_id',
          debitStats: {
            $filter: {
              input: '$stats',
              as: 'stat',
              cond: { $eq: ['$$stat.direction', 'debit'] },
            },
          },
          creditStats: {
            $filter: {
              input: '$stats',
              as: 'stat',
              cond: { $eq: ['$$stat.direction', 'credit'] },
            },
          },
        },
      },
      {
        $project: {
          category: 1,
          expenses: { $arrayElemAt: ['$debitStats', 0] },
          income: { $arrayElemAt: ['$creditStats', 0] },
        },
      },
      {
        $sort: { 
          'expenses.totalAmount': -1,
          'income.totalAmount': -1,
        },
      },
    ]);

    // Calculate totals for percentage calculations
    const totals = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$direction',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalExpenses = totals.find(t => t._id === 'debit')?.total || 0;
    const totalIncome = totals.find(t => t._id === 'credit')?.total || 0;

    // Add percentages to category stats
    const enrichedStats = categoryStats.map(stat => ({
      ...stat,
      expenses: stat.expenses ? {
        ...stat.expenses,
        percentage: totalExpenses > 0 ? (stat.expenses.totalAmount / totalExpenses) * 100 : 0,
      } : null,
      income: stat.income ? {
        ...stat.income,
        percentage: totalIncome > 0 ? (stat.income.totalAmount / totalIncome) * 100 : 0,
      } : null,
    }));

    // Get monthly trend for top categories
    const topCategories = enrichedStats.slice(0, 5).map(s => s.category);
    
    const sixMonthsAgo = dayjs().subtract(6, 'months').startOf('month').toDate();
    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          txnDate: { $gte: sixMonthsAgo },
          category: { $in: topCategories },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$txnDate' },
            month: { $month: '$txnDate' },
            category: { $ifNull: ['$category', 'Uncategorized'] },
            direction: '$direction',
          },
          amount: { $sum: '$amount' },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    // Format monthly trend data
    const trendData: any = {};
    topCategories.forEach(category => {
      trendData[category] = {
        labels: [],
        income: [],
        expenses: [],
      };
    });

    for (let i = 5; i >= 0; i--) {
      const targetDate = dayjs().subtract(i, 'months');
      const year = targetDate.year();
      const month = targetDate.month() + 1;
      const monthLabel = targetDate.format('MMM');

      topCategories.forEach(category => {
        if (!trendData[category].labels.includes(monthLabel)) {
          trendData[category].labels.push(monthLabel);
        }

        const incomeData = monthlyTrend.find(
          item => item._id.year === year && 
                  item._id.month === month && 
                  item._id.category === category &&
                  item._id.direction === 'credit'
        );
        const expenseData = monthlyTrend.find(
          item => item._id.year === year && 
                  item._id.month === month && 
                  item._id.category === category &&
                  item._id.direction === 'debit'
        );

        trendData[category].income.push(incomeData?.amount || 0);
        trendData[category].expenses.push(expenseData?.amount || 0);
      });
    }

    return NextResponse.json({
      success: true,
      categories: allCategories.filter(c => c !== null),
      statistics: enrichedStats,
      totals: {
        expenses: totalExpenses,
        income: totalIncome,
      },
      monthlyTrend: trendData,
    });

  } catch (error: any) {
    console.error('Error fetching category data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch category data', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST: Bulk categorize transactions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { rules, applyToUncategorized = false, applyToAll = false } = body;

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json(
        { error: 'Categorization rules are required' },
        { status: 400 }
      );
    }

    // Validate rules format
    for (const rule of rules) {
      if (!rule.pattern || !rule.category) {
        return NextResponse.json(
          { error: 'Each rule must have a pattern and category' },
          { status: 400 }
        );
      }
    }

    let totalUpdated = 0;
    const results = [];

    for (const rule of rules) {
      const filter: any = {
        description: { 
          $regex: rule.pattern, 
          $options: rule.caseSensitive ? '' : 'i' 
        },
      };

      // Apply filter based on options
      if (applyToUncategorized) {
        filter.$or = [
          { category: null },
          { category: '' },
          { category: 'Uncategorized' },
        ];
      } else if (!applyToAll) {
        // Only apply to transactions without categories
        filter.category = null;
      }

      const updateResult = await Transaction.updateMany(
        filter,
        { $set: { category: rule.category } }
      );

      results.push({
        rule: rule.pattern,
        category: rule.category,
        matched: updateResult.matchedCount,
        updated: updateResult.modifiedCount,
      });

      totalUpdated += updateResult.modifiedCount;
    }

    return NextResponse.json({
      success: true,
      totalUpdated,
      results,
    });

  } catch (error: any) {
    console.error('Error categorizing transactions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to categorize transactions', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PATCH: Update category names globally
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { oldCategory, newCategory } = body;

    if (!oldCategory || !newCategory) {
      return NextResponse.json(
        { error: 'Both old and new category names are required' },
        { status: 400 }
      );
    }

    if (oldCategory === newCategory) {
      return NextResponse.json(
        { error: 'Old and new category names must be different' },
        { status: 400 }
      );
    }

    // Update all transactions with the old category name
    const updateResult = await Transaction.updateMany(
      { category: oldCategory },
      { $set: { category: newCategory } }
    );

    return NextResponse.json({
      success: true,
      updated: updateResult.modifiedCount,
      matched: updateResult.matchedCount,
    });

  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update category', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove category from transactions
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Set category to null for all matching transactions
    const updateResult = await Transaction.updateMany(
      { category },
      { $unset: { category: '' } }
    );

    return NextResponse.json({
      success: true,
      updated: updateResult.modifiedCount,
      matched: updateResult.matchedCount,
    });

  } catch (error: any) {
    console.error('Error removing category:', error);
    return NextResponse.json(
      { 
        error: 'Failed to remove category', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}