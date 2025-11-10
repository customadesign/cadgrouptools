import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Company } from '@/models/Company';
import { Category } from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import dayjs from 'dayjs';

// GET /api/reports/pl - Profit & Loss Statement
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const compareToPrevious = searchParams.get('compareToPrevious') === 'true';

    // Validate required parameters
    if (!companyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: companyId, startDate, endDate' },
        { status: 400 }
      );
    }

    // Get company details
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate revenue (credit transactions)
    const revenueAggregation = await Transaction.aggregate([
      {
        $match: {
          company: company._id,
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
          percentage: 0, // Will calculate after
        };
      })
    );

    const totalRevenue = revenueCategories.reduce((sum, cat) => sum + cat.amount, 0);

    // Calculate percentages
    revenueCategories.forEach(cat => {
      cat.percentage = totalRevenue > 0 ? (cat.amount / totalRevenue) * 100 : 0;
    });

    // Calculate expenses (debit transactions)
    const expenseAggregation = await Transaction.aggregate([
      {
        $match: {
          company: company._id,
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

    // Get category details for expenses with subcategories
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

    // Build response
    const response: any = {
      company: {
        id: company._id,
        name: company.name,
        currency: company.currency,
      },
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
    };

    // If comparison requested, calculate previous period
    if (compareToPrevious) {
      const periodDays = dayjs(end).diff(dayjs(start), 'days') + 1;
      const prevStart = dayjs(start).subtract(periodDays, 'days').toDate();
      const prevEnd = dayjs(start).subtract(1, 'day').toDate();

      const prevRevenue = await Transaction.aggregate([
        {
          $match: {
            company: company._id,
            txnDate: { $gte: prevStart, $lte: prevEnd },
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

      const prevExpenses = await Transaction.aggregate([
        {
          $match: {
            company: company._id,
            txnDate: { $gte: prevStart, $lte: prevEnd },
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

      const prevRevenueTotal = prevRevenue[0]?.total || 0;
      const prevExpensesTotal = prevExpenses[0]?.total || 0;
      const prevNetIncome = prevRevenueTotal - prevExpensesTotal;

      response.comparison = {
        revenue: {
          amount: prevRevenueTotal,
          percentChange: prevRevenueTotal > 0 
            ? ((totalRevenue - prevRevenueTotal) / prevRevenueTotal) * 100 
            : 0,
        },
        expenses: {
          amount: prevExpensesTotal,
          percentChange: prevExpensesTotal > 0 
            ? ((totalExpenses - prevExpensesTotal) / prevExpensesTotal) * 100 
            : 0,
        },
        netIncome: {
          amount: prevNetIncome,
          percentChange: prevNetIncome !== 0 
            ? ((netIncome - prevNetIncome) / Math.abs(prevNetIncome)) * 100 
            : 0,
        },
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating P&L report:', error);
    return NextResponse.json(
      { error: 'Failed to generate P&L report', details: error.message },
      { status: 500 }
    );
  }
}

