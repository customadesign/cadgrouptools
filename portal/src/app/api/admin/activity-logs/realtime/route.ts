import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '1h'; // 1h, 24h, 7d, 30d
    const groupBy = searchParams.get('groupBy') || 'minute'; // minute, hour, day

    // Calculate start time based on range
    const now = new Date();
    let startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setHours(now.getHours() - 1);
    }

    // Fetch recent activities
    const recentActivities = await ActivityLog
      .find({ timestamp: { $gte: startTime } })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    // Calculate real-time statistics
    const stats = {
      timestamp: now,
      range: timeRange,
      summary: {
        totalActivities: recentActivities.length,
        uniqueUsers: new Set(recentActivities.map(a => a.userId)).size,
        successRate: calculateSuccessRate(recentActivities),
        averageResponseTime: calculateAverageResponseTime(recentActivities),
        errorCount: recentActivities.filter(a => !a.success).length,
      },
      activeUsers: getActiveUsers(recentActivities),
      topActions: getTopActions(recentActivities),
      topResources: getTopResources(recentActivities),
      recentErrors: getRecentErrors(recentActivities),
      timeline: generateTimeline(recentActivities, groupBy),
      userActivity: getUserActivitySummary(recentActivities),
      systemHealth: calculateSystemHealth(recentActivities),
    };

    // Set cache headers for efficient polling
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Timestamp': now.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error fetching real-time activity stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time statistics' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateSuccessRate(activities: any[]): number {
  if (activities.length === 0) return 100;
  const successful = activities.filter(a => a.success).length;
  return Math.round((successful / activities.length) * 100);
}

function calculateAverageResponseTime(activities: any[]): number {
  const withResponseTime = activities.filter(a => a.responseTime);
  if (withResponseTime.length === 0) return 0;
  
  const total = withResponseTime.reduce((sum, a) => sum + a.responseTime, 0);
  return Math.round(total / withResponseTime.length);
}

function getActiveUsers(activities: any[]): any[] {
  const userMap = new Map();
  
  activities.forEach(activity => {
    if (!userMap.has(activity.userId)) {
      userMap.set(activity.userId, {
        userId: activity.userId,
        userName: activity.userName,
        userEmail: activity.userEmail,
        activityCount: 0,
        lastActivity: activity.timestamp,
        actions: new Set(),
      });
    }
    
    const user = userMap.get(activity.userId);
    user.activityCount++;
    user.actions.add(activity.actionType);
    if (new Date(activity.timestamp) > new Date(user.lastActivity)) {
      user.lastActivity = activity.timestamp;
    }
  });
  
  return Array.from(userMap.values())
    .map(user => ({
      ...user,
      actions: Array.from(user.actions),
    }))
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 10);
}

function getTopActions(activities: any[]): any[] {
  const actionCounts = new Map();
  
  activities.forEach(activity => {
    const key = activity.actionType;
    actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
  });
  
  return Array.from(actionCounts.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getTopResources(activities: any[]): any[] {
  const resourceCounts = new Map();
  
  activities.forEach(activity => {
    const key = activity.resourceType;
    resourceCounts.set(key, (resourceCounts.get(key) || 0) + 1);
  });
  
  return Array.from(resourceCounts.entries())
    .map(([resource, count]) => ({ resource, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getRecentErrors(activities: any[]): any[] {
  return activities
    .filter(a => !a.success)
    .slice(0, 10)
    .map(activity => ({
      timestamp: activity.timestamp,
      userId: activity.userId,
      userName: activity.userName,
      actionType: activity.actionType,
      resourceType: activity.resourceType,
      errorMessage: activity.errorMessage,
      statusCode: activity.statusCode,
      endpoint: activity.endpoint,
    }));
}

function generateTimeline(activities: any[], groupBy: string): any[] {
  const timeline = new Map();
  
  activities.forEach(activity => {
    const timestamp = new Date(activity.timestamp);
    let key: string;
    
    switch (groupBy) {
      case 'minute':
        key = `${timestamp.getHours()}:${Math.floor(timestamp.getMinutes() / 5) * 5}`;
        break;
      case 'hour':
        key = `${timestamp.getHours()}:00`;
        break;
      case 'day':
        key = timestamp.toDateString();
        break;
      default:
        key = `${timestamp.getHours()}:${Math.floor(timestamp.getMinutes() / 5) * 5}`;
    }
    
    if (!timeline.has(key)) {
      timeline.set(key, {
        time: key,
        count: 0,
        success: 0,
        errors: 0,
      });
    }
    
    const entry = timeline.get(key);
    entry.count++;
    if (activity.success) {
      entry.success++;
    } else {
      entry.errors++;
    }
  });
  
  return Array.from(timeline.values())
    .sort((a, b) => a.time.localeCompare(b.time));
}

function getUserActivitySummary(activities: any[]): any {
  const userTypes = new Map();
  
  activities.forEach(activity => {
    const role = activity.userRole || 'unknown';
    if (!userTypes.has(role)) {
      userTypes.set(role, {
        role,
        count: 0,
        users: new Set(),
      });
    }
    
    const entry = userTypes.get(role);
    entry.count++;
    entry.users.add(activity.userId);
  });
  
  return Array.from(userTypes.values()).map(entry => ({
    role: entry.role,
    activityCount: entry.count,
    uniqueUsers: entry.users.size,
  }));
}

function calculateSystemHealth(activities: any[]): any {
  const recentActivities = activities.slice(0, 50); // Last 50 activities
  
  const metrics = {
    errorRate: 100 - calculateSuccessRate(recentActivities),
    avgResponseTime: calculateAverageResponseTime(recentActivities),
    activeUsers: new Set(recentActivities.map(a => a.userId)).size,
  };
  
  // Calculate health score (0-100)
  let healthScore = 100;
  
  // Deduct for high error rate
  if (metrics.errorRate > 5) healthScore -= 20;
  if (metrics.errorRate > 10) healthScore -= 20;
  if (metrics.errorRate > 20) healthScore -= 20;
  
  // Deduct for slow response times
  if (metrics.avgResponseTime > 1000) healthScore -= 10;
  if (metrics.avgResponseTime > 2000) healthScore -= 10;
  if (metrics.avgResponseTime > 5000) healthScore -= 10;
  
  // Boost for active users
  if (metrics.activeUsers > 5) healthScore += 5;
  if (metrics.activeUsers > 10) healthScore += 5;
  
  healthScore = Math.max(0, Math.min(100, healthScore));
  
  return {
    score: healthScore,
    status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : 'unhealthy',
    metrics,
    recommendations: getHealthRecommendations(metrics),
  };
}

function getHealthRecommendations(metrics: any): string[] {
  const recommendations = [];
  
  if (metrics.errorRate > 10) {
    recommendations.push('High error rate detected. Review recent errors and system logs.');
  }
  
  if (metrics.avgResponseTime > 2000) {
    recommendations.push('Slow response times detected. Consider optimizing database queries or API endpoints.');
  }
  
  if (metrics.activeUsers < 2) {
    recommendations.push('Low user activity. Verify system accessibility and user notifications.');
  }
  
  return recommendations;
}