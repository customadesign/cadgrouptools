import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Company } from '@/models/Company';
import { Category } from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(quarterOfYear);

// GET /api/reports/tax-summary - Tax Summary Report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const quarter = parseInt(searchParams.get('quarter') || '0'); // 1-4
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Validate required parameters
    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing required parameter: companyId' },
        { status: 400 }
      );
    }

    if (quarter < 1 || quarter > 4) {
      return NextResponse.json(
        { error: 'Invalid quarter. Must be 1-4' },
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

    // Calculate quarter date range
    const quarterStart = dayjs().year(year).quarter(quarter).startOf('quarter').toDate();
    const quarterEnd = dayjs().year(year).quarter(quarter).endOf('quarter').toDate();

    // Get quarterly income (revenue)
    const incomeResult = await Transaction.aggregate([
      {
        $match: {
          company: company._id,
          txnDate: { $gte: quarterStart, $lte: quarterEnd },
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

    const quarterlyIncome = incomeResult[0]?.total || 0;

    // Get deductible expenses
    const deductibleExpensesAgg = await Transaction.aggregate([
      {
        $match: {
          company: company._id,
          txnDate: { $gte: quarterStart, $lte: quarterEnd },
          direction: 'debit',
          taxDeductible: true,
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

    const deductibleCategories = await Promise.all(
      deductibleExpensesAgg.map(async (item) => {
        const category = await Category.findById(item._id).lean();
        return {
          categoryId: item._id,
          name: category?.name || 'Unknown',
          amount: item.amount,
          count: item.count,
          birCategory: category?.birCategory,
        };
      })
    );

    const totalDeductibleExpenses = deductibleCategories.reduce((sum, cat) => sum + cat.amount, 0);

    // Get non-deductible expenses
    const nonDeductibleExpensesAgg = await Transaction.aggregate([
      {
        $match: {
          company: company._id,
          txnDate: { $gte: quarterStart, $lte: quarterEnd },
          direction: 'debit',
          taxDeductible: false,
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

    const nonDeductibleCategories = await Promise.all(
      nonDeductibleExpensesAgg.map(async (item) => {
        const category = await Category.findById(item._id).lean();
        return {
          categoryId: item._id,
          name: category?.name || 'Unknown',
          amount: item.amount,
          count: item.count,
          birCategory: category?.birCategory,
        };
      })
    );

    const totalNonDeductibleExpenses = nonDeductibleCategories.reduce((sum, cat) => sum + cat.amount, 0);

    // Calculate taxable income
    const taxableIncome = quarterlyIncome - totalDeductibleExpenses;

    const response = {
      company: {
        id: company._id,
        name: company.name,
        legalName: company.legalName,
        taxId: company.taxId,
        currency: company.currency,
      },
      period: {
        quarter,
        year,
        startDate: quarterStart.toISOString().split('T')[0],
        endDate: quarterEnd.toISOString().split('T')[0],
      },
      quarterlyIncome,
      deductibleExpenses: {
        total: totalDeductibleExpenses,
        categories: deductibleCategories,
      },
      nonDeductibleExpenses: {
        total: totalNonDeductibleExpenses,
        categories: nonDeductibleCategories,
      },
      taxableIncome,
      birReadyData: {
        // Placeholder for future BIR form mapping
        note: 'BIR form mapping will be added in future updates',
        tinNumber: company.taxId,
        businessName: company.legalName,
        period: `Q${quarter} ${year}`,
        grossIncome: quarterlyIncome,
        allowableDeductions: totalDeductibleExpenses,
        netTaxableIncome: taxableIncome,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating tax summary report:', error);
    return NextResponse.json(
      { error: 'Failed to generate tax summary report', details: error.message },
      { status: 500 }
    );
  }
}


