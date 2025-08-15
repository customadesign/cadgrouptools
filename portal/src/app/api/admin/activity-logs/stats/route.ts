import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';

/**
 * GET /api/admin/activity-logs/stats
 * Get activity statistics and analytics
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

    // Parse query parameters for date range
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    
    // Build base filter
    const baseFilter: any = {};
    if (startDate || endDate) {
      baseFilter.timestamp = {};
      if (startDate) {
        baseFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        baseFilter.timestamp.$lte = end;
      }
    }
    if (userId) {
      baseFilter.userId = userId;
    }

    // Execute multiple aggregations in parallel
    const [
      totalActivities,
      successRate,
      actionTypeDistribution,
      resourceTypeDistribution,
      userActivityStats,
      hourlyDistribution,
      topUsers,
      recentErrors,
      averageResponseTime,
      dailyTrends
    ] = await Promise.all([
      // Total activities count
      ActivityLog.countDocuments(baseFilter),
      
      // Success rate
      ActivityLog.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            successful: {
              $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
            }
          }
        }
      ]),
      
      // Action type distribution
      ActivityLog.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$actionType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Resource type distribution
      ActivityLog.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$resourceType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // User activity statistics
      ActivityLog.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$userId',
            userName: { $first: '$userName' },
            userEmail: { $first: '$userEmail' },
            userRole: { $first: '$userRole' },
            activityCount: { $sum: 1 },
            lastActivity: { $max: '$timestamp' }
          }
        },
        { $sort: { activityCount: -1 } },
        { $limit: 10 }
      ]),
      
      // Hourly distribution (last 24 hours)
      ActivityLog.aggregate([
        {
          $match: {
            ...baseFilter,
            timestamp: {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              hour: { $hour: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.hour': 1 } }
      ]),
      
      // Top users by activity
      ActivityLog.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: {
              userId: '$userId',
              userName: '$userName',
              userEmail: '$userEmail'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Recent errors
      ActivityLog.find({
        ...baseFilter,
        success: false
      })
        .sort({ timestamp: -1 })
        .limit(10)
        .select('userName actionType resourceType errorMessage timestamp statusCode')
        .lean(),
      
      // Average response time
      ActivityLog.aggregate([
        {
          $match: {
            ...baseFilter,
            responseTime: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' },
            minResponseTime: { $min: '$responseTime' },
            maxResponseTime: { $max: '$responseTime' }
          }
        }
      ]),
      
      // Daily trends (last 30 days)
      ActivityLog.aggregate([
        {
          $match: {
            ...baseFilter,
            timestamp: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
            },
            failureCount: {
              $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
            }
          }
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
            '_id.day': 1
          }
        }
      ])
    ]);

    // Process success rate
    const successRateData = successRate[0] || { total: 0, successful: 0 };
    const successPercentage = successRateData.total > 0
      ? (successRateData.successful / successRateData.total) * 100
      : 0;

    // Process response time data
    const responseTimeData = averageResponseTime[0] || {
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0
    };

    // Format hourly distribution
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourlyDistribution.find(h => h._id.hour === i);
      return {
        hour: i,
        count: hourData ? hourData.count : 0
      };
    });

    // Format daily trends
    const dailyTrendsFormatted = dailyTrends.map(day => ({
      date: new Date(day._id.year, day._id.month - 1, day._id.day).toISOString().split('T')[0],
      total: day.count,
      successful: day.successCount,
      failed: day.failureCount
    }));

    return NextResponse.json({
      overview: {
        totalActivities,
        successRate: successPercentage.toFixed(2),
        totalSuccess: successRateData.successful,
        totalFailure: successRateData.total - successRateData.successful
      },
      performance: {
        averageResponseTime: Math.round(responseTimeData.avgResponseTime),
        minResponseTime: Math.round(responseTimeData.minResponseTime),
        maxResponseTime: Math.round(responseTimeData.maxResponseTime)
      },
      distributions: {
        actionTypes: actionTypeDistribution.map(item => ({
          type: item._id,
          count: item.count
        })),
        resourceTypes: resourceTypeDistribution.map(item => ({
          type: item._id,
          count: item.count
        }))
      },
      userActivity: {
        topUsers: userActivityStats,
        mostActive: topUsers.map(user => ({
          userId: user._id.userId,
          userName: user._id.userName,
          userEmail: user._id.userEmail,
          activityCount: user.count
        }))
      },
      trends: {
        hourly: hourlyData,
        daily: dailyTrendsFormatted
      },
      recentErrors: recentErrors.map(error => ({
        userName: error.userName,
        actionType: error.actionType,
        resourceType: error.resourceType,
        errorMessage: error.errorMessage,
        timestamp: error.timestamp,
        statusCode: error.statusCode
      }))
    });
  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity statistics' },
      { status: 500 }
    );
  }
}