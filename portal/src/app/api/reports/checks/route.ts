import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Company } from '@/models/Company';
import { Category } from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import dayjs from 'dayjs';

// GET /api/reports/checks - Check Register Report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const month = parseInt(searchParams.get('month') || '0');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const sortBy = searchParams.get('sortBy') || 'checkNo'; // checkNo | date

    // Validate required parameters
    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing required parameter: companyId' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month. Must be 1-12' },
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

    // Calculate month date range
    const monthStart = new Date(year, month - 1, 1); // First day of month
    const monthEnd = new Date(year, month, 1); // First day of next month

    // Build query for check transactions
    const query = {
      company: company._id,
      txnDate: {
        $gte: monthStart,
        $lt: monthEnd,
      },
      checkNo: { $exists: true, $ne: null, $ne: '' },
      direction: 'debit', // Checks are always expenses (debits)
    };

    // Determine sort order
    const sort: any = sortBy === 'date' 
      ? { txnDate: 1, checkNo: 1 }
      : { checkNo: 1 };

    // Get check transactions
    const checks = await Transaction.find(query)
      .sort(sort)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .lean();

    // Format checks for response
    const formattedChecks = checks.map(check => {
      const categoryName = (check.category as any)?.name || 'Unknown';
      const subcategoryName = (check.subcategory as any)?.name;
      
      // Format purpose as "Category" or "Category → Subcategory"
      const purpose = subcategoryName 
        ? `${categoryName} → ${subcategoryName}`
        : categoryName;

      return {
        id: check._id.toString(), // Add transaction ID for editing
        checkNo: check.checkNo,
        date: check.txnDate,
        amount: check.amount,
        vendor: check.vendor || 'Unknown',
        category: {
          id: (check.category as any)?._id,
          name: categoryName,
        },
        subcategory: subcategoryName ? {
          id: (check.subcategory as any)._id,
          name: subcategoryName,
        } : null,
        description: check.description,
        purpose,
        confidence: check.confidence, // OCR confidence score
      };
    });

    // Calculate summary
    const totalChecks = formattedChecks.length;
    const totalAmount = formattedChecks.reduce((sum, check) => sum + check.amount, 0);

    const monthName = dayjs().month(month - 1).format('MMMM');

    const response = {
      company: {
        id: company._id,
        name: company.name,
        currency: company.currency,
      },
      period: {
        month,
        year,
        monthName,
        startDate: monthStart.toISOString().split('T')[0],
        endDate: new Date(year, month - 1, new Date(year, month, 0).getDate()).toISOString().split('T')[0],
      },
      checks: formattedChecks,
      summary: {
        totalChecks,
        totalAmount,
        dateRange: `${monthName} ${year}`,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating check register report:', error);
    return NextResponse.json(
      { error: 'Failed to generate check register report', details: error.message },
      { status: 500 }
    );
  }
}

