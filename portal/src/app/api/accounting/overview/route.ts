import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Statement } from '@/models/Statement';
import { Types } from 'mongoose';
import dayjs from 'dayjs';

// GET: Fetch comprehensive accounting overview data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const includeBalances = searchParams.get('includeBalances') === 'true';

    // Default to current month if no dates provided
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : dayjs().startOf('month').toDate();
    const endDate = endDateParam 
      ? new Date(endDateParam) 
      : dayjs().endOf('month').toDate();

    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date parameters' },
        { status: 400 }
      );
    }

    // Build filter for the selected date range
    const dateFilter = {
      txnDate: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // 1. Calculate Key Metrics (Total Income, Expenses, Net Income, Profit Margin)
    const metricsAggregation = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$direction',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    const creditMetrics = metricsAggregation.find(m => m._id === 'credit') || { 
      totalAmount: 0, 
      count: 0, 
      avgAmount: 0 
    };
    const debitMetrics = metricsAggregation.find(m => m._id === 'debit') || { 
      totalAmount: 0, 
      count: 0, 
      avgAmount: 0 
    };

    const totalIncome = creditMetrics.totalAmount;
    const totalExpenses = debitMetrics.totalAmount;
    const netIncome = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    // 2. Get Recent Transactions (last 10)
    const recentTransactions = await Transaction
      .find({})
      .populate({
        path: 'statement',
        select: 'accountName bankName',
      })
      .sort({ txnDate: -1, createdAt: -1 })
      .limit(10)
      .lean();

    // Format recent transactions for frontend
    const formattedRecentTransactions = recentTransactions.map(txn => ({
      id: txn._id.toString(),
      date: txn.txnDate,
      description: txn.description,
      category: txn.category || 'Uncategorized',
      amount: txn.amount,
      type: txn.direction === 'credit' ? 'income' : 'expense',
      status: 'completed',
      account: (txn.statement as any)?.accountName || 'Unknown Account',
      checkNo: txn.checkNo,
      balance: txn.balance,
    }));

    // 3. Cash Flow Trend Data (last 6 months)
    const sixMonthsAgo = dayjs().subtract(6, 'months').startOf('month').toDate();
    const cashFlowAggregation = await Transaction.aggregate([
      {
        $match: {
          txnDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$txnDate' },
            month: { $month: '$txnDate' },
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

    // Format cash flow data for Chart.js
    const monthLabels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = dayjs().subtract(i, 'months');
      const year = targetDate.year();
      const month = targetDate.month() + 1; // dayjs months are 0-indexed
      const monthLabel = targetDate.format('MMM');
      
      monthLabels.push(monthLabel);
      
      const monthIncome = cashFlowAggregation.find(
        item => item._id.year === year && 
                item._id.month === month && 
                item._id.direction === 'credit'
      );
      const monthExpense = cashFlowAggregation.find(
        item => item._id.year === year && 
                item._id.month === month && 
                item._id.direction === 'debit'
      );
      
      incomeData.push(monthIncome?.amount || 0);
      expenseData.push(monthExpense?.amount || 0);
    }

    const cashFlowTrend = {
      labels: monthLabels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#52c41a',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#ff4d4f',
          backgroundColor: 'rgba(255, 77, 79, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };

    // 4. Expense Categories Breakdown
    const categoryAggregation = await Transaction.aggregate([
      {
        $match: {
          ...dateFilter,
          direction: 'debit',
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$category', 'Uncategorized'] },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);

    // Calculate percentages and format for frontend
    const totalCategoryAmount = categoryAggregation.reduce((sum, cat) => sum + cat.amount, 0);
    const expenseCategories = categoryAggregation.map(cat => ({
      name: cat._id,
      amount: cat.amount,
      percentage: totalCategoryAmount > 0 ? (cat.amount / totalCategoryAmount) * 100 : 0,
      count: cat.count,
    }));

    // Get top 6 categories and group the rest as "Other"
    const topCategories = expenseCategories.slice(0, 6);
    const otherCategories = expenseCategories.slice(6);
    
    if (otherCategories.length > 0) {
      const otherAmount = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
      const otherCount = otherCategories.reduce((sum, cat) => sum + cat.count, 0);
      topCategories.push({
        name: 'Other',
        amount: otherAmount,
        percentage: totalCategoryAmount > 0 ? (otherAmount / totalCategoryAmount) * 100 : 0,
        count: otherCount,
      });
    }

    // 5. Monthly Comparison (this month vs last month)
    const thisMonthStart = dayjs().startOf('month').toDate();
    const thisMonthEnd = dayjs().endOf('month').toDate();
    const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').toDate();

    const [thisMonthStats, lastMonthStats] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            txnDate: { $gte: thisMonthStart, $lte: thisMonthEnd },
          },
        },
        {
          $group: {
            _id: '$direction',
            amount: { $sum: '$amount' },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            txnDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
          },
        },
        {
          $group: {
            _id: '$direction',
            amount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const thisMonthIncome = thisMonthStats.find(s => s._id === 'credit')?.amount || 0;
    const thisMonthExpenses = thisMonthStats.find(s => s._id === 'debit')?.amount || 0;
    const lastMonthIncome = lastMonthStats.find(s => s._id === 'credit')?.amount || 0;
    const lastMonthExpenses = lastMonthStats.find(s => s._id === 'debit')?.amount || 0;

    const monthlyComparison = {
      thisMonth: {
        income: thisMonthIncome,
        expenses: thisMonthExpenses,
        net: thisMonthIncome - thisMonthExpenses,
      },
      lastMonth: {
        income: lastMonthIncome,
        expenses: lastMonthExpenses,
        net: lastMonthIncome - lastMonthExpenses,
      },
      percentageChange: {
        income: lastMonthIncome > 0 
          ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 
          : 0,
        expenses: lastMonthExpenses > 0 
          ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
          : 0,
        net: (lastMonthIncome - lastMonthExpenses) !== 0
          ? (((thisMonthIncome - thisMonthExpenses) - (lastMonthIncome - lastMonthExpenses)) / 
             Math.abs(lastMonthIncome - lastMonthExpenses)) * 100
          : 0,
      },
    };

    // 6. Account Balances (optional, based on latest transaction balance per account)
    let accountBalances = [];
    if (includeBalances) {
      // Get the latest transaction for each unique account to get current balance
      const latestBalances = await Transaction.aggregate([
        {
          $lookup: {
            from: 'statements',
            localField: 'statement',
            foreignField: '_id',
            as: 'statementInfo',
          },
        },
        {
          $unwind: '$statementInfo',
        },
        {
          $sort: { txnDate: -1 },
        },
        {
          $group: {
            _id: '$statementInfo.accountName',
            latestBalance: { $first: '$balance' },
            latestDate: { $first: '$txnDate' },
            bankName: { $first: '$statementInfo.bankName' },
          },
        },
        {
          $project: {
            accountName: '$_id',
            balance: '$latestBalance',
            lastUpdated: '$latestDate',
            bankName: 1,
            _id: 0,
          },
        },
      ]);

      accountBalances = latestBalances;
    }

    // 7. Additional Statistics
    const additionalStats = {
      totalTransactions: creditMetrics.count + debitMetrics.count,
      avgTransactionAmount: {
        income: creditMetrics.avgAmount || 0,
        expense: debitMetrics.avgAmount || 0,
      },
      largestIncome: await Transaction
        .findOne({ ...dateFilter, direction: 'credit' })
        .sort({ amount: -1 })
        .select('amount description txnDate')
        .lean(),
      largestExpense: await Transaction
        .findOne({ ...dateFilter, direction: 'debit' })
        .sort({ amount: -1 })
        .select('amount description txnDate')
        .lean(),
    };

    // Prepare the complete response
    const response = {
      success: true,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      keyMetrics: {
        totalIncome,
        totalExpenses,
        netIncome,
        profitMargin,
        transactionCounts: {
          income: creditMetrics.count,
          expense: debitMetrics.count,
        },
      },
      recentTransactions: formattedRecentTransactions,
      cashFlowTrend,
      expenseCategories: topCategories,
      monthlyComparison,
      accountBalances: includeBalances ? accountBalances : undefined,
      additionalStats,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching accounting overview:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch accounting overview', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST: Generate report for a specific period
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { startDate, endDate, reportType = 'summary', includeDetails = false } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const dateFilter = {
      txnDate: {
        $gte: start,
        $lte: end,
      },
    };

    // Generate different types of reports based on reportType
    let reportData: any = {};

    switch (reportType) {
      case 'profit_loss':
        // Profit & Loss Statement
        const plData = await Transaction.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: {
                direction: '$direction',
                category: { $ifNull: ['$category', 'Uncategorized'] },
              },
              amount: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: '$_id.direction',
              categories: {
                $push: {
                  category: '$_id.category',
                  amount: '$amount',
                  count: '$count',
                },
              },
              total: { $sum: '$amount' },
            },
          },
        ]);

        const incomeData = plData.find(d => d._id === 'credit') || { categories: [], total: 0 };
        const expenseData = plData.find(d => d._id === 'debit') || { categories: [], total: 0 };

        reportData = {
          type: 'profit_loss',
          period: { start, end },
          income: {
            categories: incomeData.categories.sort((a: any, b: any) => b.amount - a.amount),
            total: incomeData.total,
          },
          expenses: {
            categories: expenseData.categories.sort((a: any, b: any) => b.amount - a.amount),
            total: expenseData.total,
          },
          netIncome: incomeData.total - expenseData.total,
        };
        break;

      case 'cash_flow':
        // Cash Flow Statement
        const cashFlowData = await Transaction.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: {
                year: { $year: '$txnDate' },
                month: { $month: '$txnDate' },
                week: { $week: '$txnDate' },
              },
              inflows: {
                $sum: {
                  $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0],
                },
              },
              outflows: {
                $sum: {
                  $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0],
                },
              },
            },
          },
          {
            $sort: {
              '_id.year': 1,
              '_id.month': 1,
              '_id.week': 1,
            },
          },
        ]);

        reportData = {
          type: 'cash_flow',
          period: { start, end },
          data: cashFlowData.map(item => ({
            period: item._id,
            inflows: item.inflows,
            outflows: item.outflows,
            netFlow: item.inflows - item.outflows,
          })),
          totals: {
            totalInflows: cashFlowData.reduce((sum, item) => sum + item.inflows, 0),
            totalOutflows: cashFlowData.reduce((sum, item) => sum + item.outflows, 0),
          },
        };
        break;

      case 'summary':
      default:
        // Summary Report
        const summaryData = await Transaction.aggregate([
          { $match: dateFilter },
          {
            $facet: {
              byDirection: [
                {
                  $group: {
                    _id: '$direction',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avg: { $avg: '$amount' },
                    min: { $min: '$amount' },
                    max: { $max: '$amount' },
                  },
                },
              ],
              byCategory: [
                {
                  $group: {
                    _id: {
                      category: { $ifNull: ['$category', 'Uncategorized'] },
                      direction: '$direction',
                    },
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
                {
                  $sort: { amount: -1 },
                },
                {
                  $limit: 20,
                },
              ],
              byMonth: [
                {
                  $group: {
                    _id: {
                      year: { $year: '$txnDate' },
                      month: { $month: '$txnDate' },
                    },
                    income: {
                      $sum: {
                        $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0],
                      },
                    },
                    expenses: {
                      $sum: {
                        $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0],
                      },
                    },
                    count: { $sum: 1 },
                  },
                },
                {
                  $sort: {
                    '_id.year': 1,
                    '_id.month': 1,
                  },
                },
              ],
            },
          },
        ]);

        reportData = {
          type: 'summary',
          period: { start, end },
          ...summaryData[0],
        };
        break;
    }

    // Include transaction details if requested
    if (includeDetails) {
      const transactions = await Transaction
        .find(dateFilter)
        .populate({
          path: 'statement',
          select: 'accountName bankName month year',
        })
        .sort({ txnDate: -1 })
        .lean();

      reportData.transactions = transactions;
    }

    return NextResponse.json({
      success: true,
      report: reportData,
      generated: new Date(),
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate report', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}