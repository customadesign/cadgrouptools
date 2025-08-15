import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';

/**
 * POST /api/admin/activity-logs/export
 * Export activity logs in various formats (CSV, JSON)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const {
      format = 'csv',
      startDate,
      endDate,
      userId,
      actionType,
      resourceType,
      success,
      limit = 10000 // Maximum records to export
    } = body;

    // Build filter query
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (actionType) {
      filter.actionType = actionType;
    }
    
    if (resourceType) {
      filter.resourceType = resourceType;
    }
    
    if (success !== undefined && success !== null) {
      filter.success = success;
    }

    // Fetch logs
    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(limit, 10000))
      .lean();

    if (format === 'json') {
      // Return JSON format
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        totalRecords: logs.length,
        filters: {
          startDate,
          endDate,
          userId,
          actionType,
          resourceType,
          success
        },
        data: logs
      });
    } else if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Timestamp',
        'User ID',
        'User Name',
        'User Email',
        'User Role',
        'Action Type',
        'Resource Type',
        'Resource ID',
        'Resource Name',
        'Method',
        'Endpoint',
        'IP Address',
        'User Agent',
        'Success',
        'Status Code',
        'Response Time (ms)',
        'Error Message'
      ];

      const csvRows = logs.map(log => [
        log.timestamp.toISOString(),
        log.userId,
        log.userName,
        log.userEmail,
        log.userRole,
        log.actionType,
        log.resourceType,
        log.resourceId || '',
        log.resourceName || '',
        log.method,
        log.endpoint,
        log.ipAddress,
        log.userAgent,
        log.success ? 'Yes' : 'No',
        log.statusCode,
        log.responseTime || '',
        log.errorMessage || ''
      ]);

      // Escape CSV values
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Build CSV content
      const csvContent = [
        csvHeaders.map(escapeCSV).join(','),
        ...csvRows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      // Return CSV with appropriate headers
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "csv" or "json"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to export activity logs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/activity-logs/export
 * Get export options and metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    // Get available action types and resource types
    const [actionTypes, resourceTypes, dateRange] = await Promise.all([
      ActivityLog.distinct('actionType'),
      ActivityLog.distinct('resourceType'),
      ActivityLog.aggregate([
        {
          $group: {
            _id: null,
            earliestDate: { $min: '$timestamp' },
            latestDate: { $max: '$timestamp' }
          }
        }
      ])
    ]);

    const range = dateRange[0] || { earliestDate: new Date(), latestDate: new Date() };

    return NextResponse.json({
      exportOptions: {
        formats: ['csv', 'json'],
        maxRecords: 10000,
        availableFilters: {
          actionTypes: actionTypes.sort(),
          resourceTypes: resourceTypes.sort(),
          dateRange: {
            earliest: range.earliestDate,
            latest: range.latestDate
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching export options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export options' },
      { status: 500 }
    );
  }
}