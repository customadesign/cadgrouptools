import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Company } from '@/models/Company';
import { Category } from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/reports/uncategorized - Uncategorized Transactions Report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId'); // Optional - if not provided, show all companies

    let query: any = {};
    
    if (companyId) {
      const company = await Company.findById(companyId);
      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }
      query.company = company._id;
    }

    // Get "Miscellaneous" and "Other Income" category IDs
    const miscCategory = await Category.findOne({ 
      name: 'Miscellaneous',
      type: 'expense'
    });
    const otherIncomeCategory = await Category.findOne({ 
      name: 'Other Income',
      type: 'income'
    });

    const uncategorizedCategoryIds = [
      miscCategory?._id,
      otherIncomeCategory?._id,
    ].filter(Boolean);

    // Get total transaction count
    const totalCount = await Transaction.countDocuments(query);

    // Get uncategorized transactions (those in Miscellaneous or Other Income)
    const uncategorizedCount = await Transaction.countDocuments({
      ...query,
      category: { $in: uncategorizedCategoryIds },
    });

    // Calculate categorization rate
    const categorizationRate = totalCount > 0 
      ? ((totalCount - uncategorizedCount) / totalCount) * 100 
      : 100;

    // Get uncategorized transactions with details
    const transactions = await Transaction.find({
      ...query,
      category: { $in: uncategorizedCategoryIds },
    })
      .sort({ txnDate: -1, createdAt: -1 })
      .limit(100) // Limit to most recent 100
      .populate('company', 'name')
      .populate('category', 'name type')
      .populate('statement', 'accountName')
      .lean();

    const transactionsWithDetails = transactions.map(txn => ({
      id: txn._id,
      company: {
        id: (txn.company as any)?._id,
        name: (txn.company as any)?.name || 'Unknown',
      },
      date: txn.txnDate,
      description: txn.description,
      vendor: txn.vendor,
      amount: txn.amount,
      direction: txn.direction,
      category: {
        id: (txn.category as any)?._id,
        name: (txn.category as any)?.name || 'Unknown',
        type: (txn.category as any)?.type,
      },
      account: (txn.statement as any)?.accountName || 'Unknown',
      createdAt: txn.createdAt,
    }));

    // Get company breakdown if no specific company requested
    let companyBreakdown: any[] = [];
    if (!companyId) {
      const companies = await Company.find({ status: 'active' });
      
      companyBreakdown = await Promise.all(
        companies.map(async (company) => {
          const companyTotal = await Transaction.countDocuments({
            company: company._id,
          });

          const companyUncategorized = await Transaction.countDocuments({
            company: company._id,
            category: { $in: uncategorizedCategoryIds },
          });

          const companyCategorizationRate = companyTotal > 0
            ? ((companyTotal - companyUncategorized) / companyTotal) * 100
            : 100;

          return {
            companyId: company._id,
            name: company.name,
            totalTransactions: companyTotal,
            uncategorizedCount: companyUncategorized,
            categorizationRate: companyCategorizationRate,
          };
        })
      );
    }

    const response = {
      company: companyId ? {
        id: companyId,
      } : null,
      totalTransactions: totalCount,
      uncategorizedCount,
      categorizedCount: totalCount - uncategorizedCount,
      categorizationRate,
      transactions: transactionsWithDetails,
      companyBreakdown: companyBreakdown.length > 0 ? companyBreakdown : undefined,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating uncategorized transactions report:', error);
    return NextResponse.json(
      { error: 'Failed to generate uncategorized transactions report', details: error.message },
      { status: 500 }
    );
  }
}


