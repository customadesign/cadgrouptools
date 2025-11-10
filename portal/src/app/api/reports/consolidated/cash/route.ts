import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Company } from '@/models/Company';
import { Account } from '@/models/Account';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/reports/consolidated/cash - Consolidated Cash Position
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyGroupId = searchParams.get('companyGroupId');

    // Get companies to consolidate
    let companies: any[];
    if (companyGroupId) {
      const CompanyGroup = (await import('@/models/CompanyGroup')).CompanyGroup;
      const group = await CompanyGroup.findById(companyGroupId).populate('companies');
      if (!group) {
        return NextResponse.json(
          { error: 'Company group not found' },
          { status: 404 }
        );
      }
      companies = group.companies;
    } else {
      // Get all active companies
      companies = await Company.find({ status: 'active' });
    }

    // Get cash position for each company
    const companyData = await Promise.all(
      companies.map(async (company) => {
        const accounts = await Account.find({ 
          company: company._id,
          status: 'active'
        }).lean();

        const accountsWithBalances = accounts.map(acc => ({
          id: acc._id,
          name: acc.name,
          bankName: acc.bankName,
          type: acc.type,
          balance: acc.balance || 0,
          currency: acc.currency || company.currency,
        }));

        const totalCash = accountsWithBalances.reduce((sum, acc) => sum + acc.balance, 0);

        return {
          companyId: company._id,
          name: company.name,
          currency: company.currency,
          cash: totalCash,
          accounts: accountsWithBalances,
        };
      })
    );

    // Calculate total cash across all companies
    const totalCash = companyData.reduce((sum, c) => sum + c.cash, 0);

    // Group by account type
    const byAccountType: Record<string, number> = {
      checking: 0,
      savings: 0,
      credit: 0,
      investment: 0,
    };

    for (const company of companyData) {
      for (const account of company.accounts) {
        if (byAccountType[account.type] !== undefined) {
          byAccountType[account.type] += account.balance;
        }
      }
    }

    const response = {
      totalCash,
      companies: companyData.sort((a, b) => b.cash - a.cash),
      byAccountType,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating consolidated cash position report:', error);
    return NextResponse.json(
      { error: 'Failed to generate consolidated cash position report', details: error.message },
      { status: 500 }
    );
  }
}

