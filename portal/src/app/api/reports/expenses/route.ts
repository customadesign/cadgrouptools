import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Company } from '@/models/Company';
import { Category } from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import dayjs from 'dayjs';

// GET /api/reports/expenses - Expense Report by Category
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
    const groupBy = searchParams.get('groupBy') || 'category'; // category | month

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

    // Get total expenses
    const totalExpensesResult = await Transaction.aggregate([
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

    const totalExpenses = totalExpensesResult[0]?.total || 0;

    // Group by category
    const categoryAggregation = await Transaction.aggregate([
      {
        $match: {
          company: company._id,
          txnDate: { $gte: start, $lte: end },
          direction: 'debit',
        },
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);

    // Get category details and trends
    const categories = await Promise.all(
      categoryAggregation.map(async (item) => {
        const category = await Category.findById(item._id).lean();

        // Get monthly trend if groupBy is month
        let trend: Array<{ month: string; amount: number }> = [];
        if (groupBy === 'month') {
          const monthlyData = await Transaction.aggregate([
            {
              $match: {
                company: company._id,
                category: item._id,
                txnDate: { $gte: start, $lte: end },
                direction: 'debit',
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: '$txnDate' },
                  month: { $month: '$txnDate' },
                },
                amount: { $sum: '$amount' },
              },
            },
            {
              $sort: { '_id.year': 1, '_id.month': 1 },
            },
          ]);

          trend = monthlyData.map(d => ({
            month: `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
            amount: d.amount,
          }));
        }

        // Get top vendors for this category
        const vendorAggregation = await Transaction.aggregate([
          {
            $match: {
              company: company._id,
              category: item._id,
              txnDate: { $gte: start, $lte: end },
              direction: 'debit',
              vendor: { $exists: true, $ne: null, $ne: '' },
            },
          },
          {
            $group: {
              _id: '$vendor',
              amount: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { amount: -1 },
          },
          {
            $limit: 5,
          },
        ]);

        const topVendors = vendorAggregation.map(v => ({
          vendor: v._id,
          amount: v.amount,
          count: v.count,
        }));

        return {
          categoryId: item._id,
          name: category?.name || 'Unknown',
          amount: item.amount,
          percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0,
          transactionCount: item.count,
          trend,
          topVendors,
        };
      })
    );

    const response = {
      company: {
        id: company._id,
        name: company.name,
        currency: company.currency,
      },
      period: {
        startDate: startDate,
        endDate: endDate,
      },
      totalExpenses,
      categories,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating expense report:', error);
    return NextResponse.json(
      { error: 'Failed to generate expense report', details: error.message },
      { status: 500 }
    );
  }
}


