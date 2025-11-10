import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Company } from '@/models/Company';
import { Account } from '@/models/Account';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/reports/consolidated/comparison - Company Comparison
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyIdsParam = searchParams.get('companyIds'); // comma-separated
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate required parameters
    if (!companyIdsParam || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: companyIds, startDate, endDate' },
        { status: 400 }
      );
    }

    const companyIds = companyIdsParam.split(',');
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get company details
    const companies = await Company.find({ 
      _id: { $in: companyIds },
      status: 'active'
    });

    if (companies.length === 0) {
      return NextResponse.json(
        { error: 'No active companies found' },
        { status: 404 }
      );
    }

    // Get financial data for each company
    const companyData = await Promise.all(
      companies.map(async (company) => {
        // Get revenue
        const revenueResult = await Transaction.aggregate([
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

        const revenue = revenueResult[0]?.total || 0;

        // Get expenses
        const expensesResult = await Transaction.aggregate([
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

        const expenses = expensesResult[0]?.total || 0;

        // Calculate net income and profit margin
        const netIncome = revenue - expenses;
        const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

        // Get current cash position (sum of all account balances)
        const accounts = await Account.find({ 
          company: company._id,
          status: 'active'
        });

        const cashPosition = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

        return {
          companyId: company._id,
          name: company.name,
          currency: company.currency,
          revenue,
          expenses,
          netIncome,
          profitMargin,
          cashPosition,
        };
      })
    );

    // Sort by revenue (descending)
    const sortedCompanyData = companyData.sort((a, b) => b.revenue - a.revenue);

    // Prepare chart data for visualization
    const chartData = {
      labels: sortedCompanyData.map(c => c.name),
      datasets: [
        {
          label: 'Revenue',
          data: sortedCompanyData.map(c => c.revenue),
          backgroundColor: 'rgba(82, 196, 26, 0.8)',
          borderColor: 'rgba(82, 196, 26, 1)',
          borderWidth: 1,
        },
        {
          label: 'Expenses',
          data: sortedCompanyData.map(c => c.expenses),
          backgroundColor: 'rgba(255, 77, 79, 0.8)',
          borderColor: 'rgba(255, 77, 79, 1)',
          borderWidth: 1,
        },
        {
          label: 'Net Income',
          data: sortedCompanyData.map(c => c.netIncome),
          backgroundColor: 'rgba(24, 144, 255, 0.8)',
          borderColor: 'rgba(24, 144, 255, 1)',
          borderWidth: 1,
        },
      ],
    };

    const response = {
      period: {
        startDate: startDate,
        endDate: endDate,
      },
      companies: sortedCompanyData,
      chartData,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating company comparison report:', error);
    return NextResponse.json(
      { error: 'Failed to generate company comparison report', details: error.message },
      { status: 500 }
    );
  }
}

