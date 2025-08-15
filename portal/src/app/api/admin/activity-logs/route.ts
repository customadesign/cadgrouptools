import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';

/**
 * GET /api/admin/activity-logs
 * Fetch activity logs with filtering, pagination, and sorting
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter: any = {};
    
    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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
    
    // User filter
    const userId = searchParams.get('userId');
    if (userId) {
      filter.userId = userId;
    }
    
    const userEmail = searchParams.get('userEmail');
    if (userEmail) {
      filter.userEmail = new RegExp(userEmail, 'i');
    }
    
    // Action type filter
    const actionType = searchParams.get('actionType');
    if (actionType) {
      filter.actionType = actionType;
    }
    
    // Resource type filter
    const resourceType = searchParams.get('resourceType');
    if (resourceType) {
      filter.resourceType = resourceType;
    }
    
    // Resource ID filter
    const resourceId = searchParams.get('resourceId');
    if (resourceId) {
      filter.resourceId = resourceId;
    }
    
    // Success/failure filter
    const success = searchParams.get('success');
    if (success !== null && success !== '') {
      filter.success = success === 'true';
    }
    
    // User role filter
    const userRole = searchParams.get('userRole');
    if (userRole) {
      filter.userRole = userRole;
    }
    
    // IP address filter
    const ipAddress = searchParams.get('ipAddress');
    if (ipAddress) {
      filter.ipAddress = ipAddress;
    }
    
    // HTTP method filter
    const method = searchParams.get('method');
    if (method) {
      filter.method = method;
    }
    
    // Text search
    const search = searchParams.get('search');
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sort: any = {};
    sort[sortBy] = sortOrder;
    
    // Execute queries in parallel
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(filter)
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/activity-logs
 * Delete old activity logs (admin only)
 */
export async function DELETE(request: NextRequest) {
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
    const { olderThanDays } = body;
    
    if (!olderThanDays || typeof olderThanDays !== 'number') {
      return NextResponse.json(
        { error: 'Invalid olderThanDays parameter' },
        { status: 400 }
      );
    }
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // Delete old logs
    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    return NextResponse.json({
      message: `Deleted ${result.deletedCount} activity logs older than ${olderThanDays} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity logs' },
      { status: 500 }
    );
  }
}