import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Company } from '@/models/Company';
import { Account } from '@/models/Account';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import dayjs from 'dayjs';

// GET /api/reports/cashflow - Cash Flow Statement
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

    // Get all company accounts
    const accounts = await Account.find({ 
      company: company._id,
      status: 'active'
    });

    // Calculate beginning cash (balance before start date)
    // Get the last transaction before start date for each account
    let beginningCash = 0;
    for (const account of accounts) {
      const lastTransaction = await Transaction.findOne({
        company: company._id,
        txnDate: { $lt: start },
      }).sort({ txnDate: -1, createdAt: -1 }).lean();

      if (lastTransaction && lastTransaction.balance !== undefined) {
        beginningCash += lastTransaction.balance;
      } else {
        // If no previous transaction, use account balance
        beginningCash += account.balance || 0;
      }
    }

    // Get all transactions in period
    const transactions = await Transaction.find({
      company: company._id,
      txnDate: { $gte: start, $lte: end },
    })
      .sort({ txnDate: 1, createdAt: 1 })
      .populate('category', 'name type')
      .lean();

    // Separate into inflows and outflows
    const inflows = transactions
      .filter(t => t.direction === 'credit')
      .map(t => ({
        date: t.txnDate,
        description: t.description,
        category: (t.category as any)?.name || 'Unknown',
        amount: t.amount,
      }));

    const outflows = transactions
      .filter(t => t.direction === 'debit')
      .map(t => ({
        date: t.txnDate,
        description: t.description,
        category: (t.category as any)?.name || 'Unknown',
        amount: t.amount,
      }));

    const totalInflows = inflows.reduce((sum, t) => sum + t.amount, 0);
    const totalOutflows = outflows.reduce((sum, t) => sum + t.amount, 0);
    const netCashFromOperations = totalInflows - totalOutflows;

    // Calculate ending cash
    const endingCash = beginningCash + netCashFromOperations;
    const netChange = endingCash - beginningCash;

    // Generate daily balances for chart
    const dailyBalances: Array<{ date: string; balance: number }> = [];
    let runningBalance = beginningCash;
    const currentDate = dayjs(start);
    const endDateDayjs = dayjs(end);

    while (currentDate.isBefore(endDateDayjs) || currentDate.isSame(endDateDayjs, 'day')) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayStart = currentDate.startOf('day').toDate();
      const dayEnd = currentDate.endOf('day').toDate();

      // Get transactions for this day
      const dayTransactions = transactions.filter(t => {
        const txnDate = dayjs(t.txnDate);
        return txnDate.isSame(currentDate, 'day');
      });

      // Update running balance
      for (const txn of dayTransactions) {
        if (txn.direction === 'credit') {
          runningBalance += txn.amount;
        } else {
          runningBalance -= txn.amount;
        }
      }

      dailyBalances.push({
        date: dateStr,
        balance: runningBalance,
      });

      currentDate.add(1, 'day');
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
      operatingActivities: {
        inflows: inflows,
        outflows: outflows,
        totalInflows,
        totalOutflows,
        netCashFromOperations,
      },
      beginningCash,
      endingCash,
      netChange,
      dailyBalances,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating cash flow report:', error);
    return NextResponse.json(
      { error: 'Failed to generate cash flow report', details: error.message },
      { status: 500 }
    );
  }
}

