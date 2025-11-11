import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Company } from '@/models/Company';
import { CompanyGroup } from '@/models/CompanyGroup';
import { Category } from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/reports/consolidated/pl - Consolidated P&L Statement
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyGroupId = searchParams.get('companyGroupId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: startDate, endDate' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get companies to consolidate
    let companies: any[];
    if (companyGroupId) {
      const group = await CompanyGroup.findById(companyGroupId).populate('companies');
      if (!group) {
        return NextResponse.json(
          { error: 'Company group not found' },
          { status: 404 }
        );
      }
      companies = group.companies;
    } else {
      // Consolidate all active companies
      companies = await Company.find({ status: 'active' });
    }

    const companyIds = companies.map(c => c._id);

    // Calculate consolidated revenue
    const revenueAggregation = await Transaction.aggregate([
      {
        $match: {
          company: { $in: companyIds },
          txnDate: { $gte: start, $lte: end },
          direction: 'credit',
        },
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get category details for revenue
    const revenueCategories = await Promise.all(
      revenueAggregation.map(async (item) => {
        const category = await Category.findById(item._id).lean();
        return {
          categoryId: item._id,
          name: category?.name || 'Unknown',
          amount: item.amount,
          count: item.count,
          percentage: 0,
        };
      })
    );

    const totalRevenue = revenueCategories.reduce((sum, cat) => sum + cat.amount, 0);

    // Calculate percentages
    revenueCategories.forEach(cat => {
      cat.percentage = totalRevenue > 0 ? (cat.amount / totalRevenue) * 100 : 0;
    });

    // Calculate consolidated expenses
    const expenseAggregation = await Transaction.aggregate([
      {
        $match: {
          company: { $in: companyIds },
          txnDate: { $gte: start, $lte: end },
          direction: 'debit',
        },
      },
      {
        $group: {
          _id: {
            category: '$category',
            subcategory: '$subcategory',
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get category details for expenses
    const expenseCategoryMap = new Map();

    for (const item of expenseAggregation) {
      const category = await Category.findById(item._id.category).lean();
      const categoryId = item._id.category.toString();

      if (!expenseCategoryMap.has(categoryId)) {
        expenseCategoryMap.set(categoryId, {
          categoryId: item._id.category,
          name: category?.name || 'Unknown',
          amount: 0,
          count: 0,
          percentage: 0,
          subcategories: [],
        });
      }

      const catData = expenseCategoryMap.get(categoryId);
      catData.amount += item.amount;
      catData.count += item.count;

      // Add subcategory if exists
      if (item._id.subcategory) {
        const subcategory = await Category.findById(item._id.subcategory).lean();
        catData.subcategories.push({
          categoryId: item._id.subcategory,
          name: subcategory?.name || 'Unknown',
          amount: item.amount,
          count: item.count,
        });
      }
    }

    const expenseCategories = Array.from(expenseCategoryMap.values());
    const totalExpenses = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);

    // Calculate percentages
    expenseCategories.forEach(cat => {
      cat.percentage = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
    });

    // Calculate net income and profit margin
    const netIncome = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    // Get company breakdown
    const companyBreakdown = await Promise.all(
      companies.map(async (company) => {
        const companyRevenue = await Transaction.aggregate([
          {
            $match: {
              company: company._id,
              txnDate: { $gte: start, $lte: end },
              direction: 'credit',
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        const companyExpenses = await Transaction.aggregate([
          {
            $match: {
              company: company._id,
              txnDate: { $gte: start, $lte: end },
              direction: 'debit',
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        const revenue = companyRevenue[0]?.total || 0;
        const expenses = companyExpenses[0]?.total || 0;
        const companyNetIncome = revenue - expenses;

        return {
          companyId: company._id,
          name: company.name,
          revenue,
          expenses,
          netIncome: companyNetIncome,
          profitMargin: revenue > 0 ? (companyNetIncome / revenue) * 100 : 0,
        };
      })
    );

    const response = {
      consolidated: true,
      companies: companies.map(c => ({
        id: c._id,
        name: c.name,
      })),
      period: {
        startDate: startDate,
        endDate: endDate,
      },
      revenue: {
        total: totalRevenue,
        categories: revenueCategories.sort((a, b) => b.amount - a.amount),
      },
      expenses: {
        total: totalExpenses,
        categories: expenseCategories.sort((a, b) => b.amount - a.amount),
      },
      netIncome,
      profitMargin,
      companyBreakdown,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating consolidated P&L report:', error);
    return NextResponse.json(
      { error: 'Failed to generate consolidated P&L report', details: error.message },
      { status: 500 }
    );
  }
}


