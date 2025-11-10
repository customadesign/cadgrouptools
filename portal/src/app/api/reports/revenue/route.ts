import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Company } from '@/models/Company';
import { Category } from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import dayjs from 'dayjs';

// GET /api/reports/revenue - Revenue Report by Source
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
    const groupBy = searchParams.get('groupBy') || 'category'; // category | month | client

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

    // Get total revenue
    const totalRevenueResult = await Transaction.aggregate([
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

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Group by category
    const categoryAggregation = await Transaction.aggregate([
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
      {
        $sort: { amount: -1 },
      },
    ]);

    // Get category details and trends
    const sources = await Promise.all(
      categoryAggregation.map(async (item) => {
        const category = await Category.findById(item._id).lean();

        // Get monthly trend
        const monthlyData = await Transaction.aggregate([
          {
            $match: {
              company: company._id,
              category: item._id,
              txnDate: { $gte: start, $lte: end },
              direction: 'credit',
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

        const trend = monthlyData.map(d => ({
          month: `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
          amount: d.amount,
        }));

        return {
          categoryId: item._id,
          name: category?.name || 'Unknown',
          amount: item.amount,
          percentage: totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0,
          transactionCount: item.count,
          trend,
        };
      })
    );

    // Calculate month-over-month comparison
    const monthOverMonth: Array<{ month: string; amount: number; percentChange: number }> = [];
    
    // Get revenue for each month in the period
    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          company: company._id,
          txnDate: { $gte: start, $lte: end },
          direction: 'credit',
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

    let previousAmount = 0;
    for (const monthData of monthlyRevenue) {
      const month = `${monthData._id.year}-${String(monthData._id.month).padStart(2, '0')}`;
      const amount = monthData.amount;
      const percentChange = previousAmount > 0 
        ? ((amount - previousAmount) / previousAmount) * 100 
        : 0;

      monthOverMonth.push({
        month,
        amount,
        percentChange,
      });

      previousAmount = amount;
    }

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
      totalRevenue,
      sources,
      monthOverMonth,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating revenue report:', error);
    return NextResponse.json(
      { error: 'Failed to generate revenue report', details: error.message },
      { status: 500 }
    );
  }
}

