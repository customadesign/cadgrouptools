import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Company } from '@/models/Company';
import { Category } from '@/models/Category';
import { Account } from '@/models/Account';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/reports/transactions - Transaction Register/Ledger
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
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');

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

    // Build query
    const query: any = {
      company: company._id,
      txnDate: { $gte: start, $lte: end },
    };

    if (categoryId) {
      query.$or = [
        { category: categoryId },
        { subcategory: categoryId },
      ];
    }

    if (status === 'reconciled') {
      query.isReconciled = true;
    } else if (status === 'unreconciled') {
      query.isReconciled = false;
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const totalCount = await Transaction.countDocuments(query);

    // Get paginated transactions
    const transactions = await Transaction.find(query)
      .sort({ txnDate: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('category', 'name type icon')
      .populate('subcategory', 'name')
      .populate('statement', 'accountName')
      .lean();

    // Get account information for each transaction
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (txn) => {
        let accountName = 'Unknown';
        if (txn.statement) {
          accountName = (txn.statement as any).accountName || 'Unknown';
        }

        return {
          id: txn._id,
          date: txn.txnDate,
          description: txn.description,
          vendor: txn.vendor,
          category: {
            id: (txn.category as any)?._id,
            name: (txn.category as any)?.name || 'Unknown',
            type: (txn.category as any)?.type,
            icon: (txn.category as any)?.icon,
          },
          subcategory: txn.subcategory ? {
            id: (txn.subcategory as any)._id,
            name: (txn.subcategory as any).name,
          } : null,
          amount: txn.amount,
          direction: txn.direction,
          balance: txn.balance,
          account: accountName,
          status: txn.isReconciled ? 'reconciled' : 'unreconciled',
          reconciled: txn.isReconciled,
          taxDeductible: txn.taxDeductible,
          notes: txn.notes,
          createdAt: txn.createdAt,
          updatedAt: txn.updatedAt,
        };
      })
    );

    // Calculate summary
    const summaryAggregation = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          categorized: {
            $sum: {
              $cond: [{ $ne: ['$category', null] }, 1, 0]
            }
          },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0]
            }
          },
          totalExpenses: {
            $sum: {
              $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0]
            }
          },
        },
      },
    ]);

    const summary = summaryAggregation[0] || {
      totalTransactions: 0,
      categorized: 0,
      totalIncome: 0,
      totalExpenses: 0,
    };

    summary.uncategorized = summary.totalTransactions - summary.categorized;
    summary.netChange = summary.totalIncome - summary.totalExpenses;

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
      transactions: transactionsWithDetails,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      summary,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating transaction report:', error);
    return NextResponse.json(
      { error: 'Failed to generate transaction report', details: error.message },
      { status: 500 }
    );
  }
}


