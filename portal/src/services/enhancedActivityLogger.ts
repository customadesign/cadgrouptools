import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import ActivityLog, { IActivityLog } from '@/models/ActivityLog';
import { activityLogger } from './activityLogger';

interface EnhancedLogContext extends Partial<IActivityLog> {
  startTime?: number;
  endTime?: number;
  duration?: number;
  userActions?: Array<{
    action: string;
    timestamp: Date;
    metadata?: any;
  }>;
  performance?: {
    renderTime?: number;
    apiCallTime?: number;
    dbQueryTime?: number;
  };
  device?: {
    type?: string;
    browser?: string;
    os?: string;
    screenResolution?: string;
  };
  location?: {
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
}

class EnhancedActivityLogger {
  private static instance: EnhancedActivityLogger;
  private sessionActivities: Map<string, EnhancedLogContext[]> = new Map();
  private offlineQueue: IActivityLog[] = [];
  private isOnline: boolean = true;

  private constructor() {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  public static getInstance(): EnhancedActivityLogger {
    if (!EnhancedActivityLogger.instance) {
      EnhancedActivityLogger.instance = new EnhancedActivityLogger();
    }
    return EnhancedActivityLogger.instance;
  }

  /**
   * Log an enhanced activity with session tracking
   */
  public async logEnhancedActivity(
    request: NextRequest,
    context: EnhancedLogContext
  ): Promise<void> {
    try {
      const session = await getServerSession(authOptions);
      const sessionId = session?.user?.id || 'anonymous';

      // Add to session activities
      if (!this.sessionActivities.has(sessionId)) {
        this.sessionActivities.set(sessionId, []);
      }
      this.sessionActivities.get(sessionId)?.push(context);

      // Calculate duration if start and end times are provided
      if (context.startTime && context.endTime) {
        context.duration = context.endTime - context.startTime;
      }

      // Get device information from user agent
      const userAgent = request.headers.get('user-agent') || '';
      context.device = this.parseDeviceInfo(userAgent);

      // Get location from IP (you would integrate with a geolocation service)
      const ipAddress = this.getClientIp(request);
      context.location = await this.getLocationFromIp(ipAddress);

      // Log to main activity logger
      await activityLogger.logActivity(
        request,
        {
          actionType: context.actionType || 'view',
          resourceType: context.resourceType || 'system',
          resourceId: context.resourceId,
          resourceName: context.resourceName,
          metadata: {
            ...context.metadata,
            duration: context.duration,
            performance: context.performance,
            device: context.device,
            location: context.location,
            userActions: context.userActions
          }
        },
        {
          success: context.success !== false,
          statusCode: context.statusCode || 200,
          errorMessage: context.errorMessage,
          responseTime: context.responseTime || context.duration
        }
      );
    } catch (error) {
      console.error('Failed to log enhanced activity:', error);
      // Add to offline queue if online logging fails
      if (!this.isOnline) {
        this.addToOfflineQueue(context as IActivityLog);
      }
    }
  }

  /**
   * Log a user journey (sequence of actions)
   */
  public async logUserJourney(
    userId: string,
    journey: {
      name: string;
      steps: Array<{
        action: string;
        resource: string;
        timestamp: Date;
        metadata?: any;
      }>;
      completed: boolean;
      duration: number;
    }
  ): Promise<void> {
    try {
      await connectToDatabase();
      
      const journeyLog: IActivityLog = {
        userId,
        userName: journey.name,
        userEmail: '',
        userRole: 'user' as any,
        actionType: 'journey' as any,
        resourceType: 'system',
        resourceName: journey.name,
        method: 'POST' as any,
        endpoint: '/journey',
        ipAddress: '0.0.0.0',
        userAgent: 'System',
        timestamp: new Date(),
        success: journey.completed,
        statusCode: 200,
        responseTime: journey.duration,
        metadata: {
          steps: journey.steps,
          stepCount: journey.steps.length,
          completed: journey.completed
        }
      };

      await ActivityLog.create(journeyLog);
    } catch (error) {
      console.error('Failed to log user journey:', error);
    }
  }

  /**
   * Log bulk activities (for batch processing)
   */
  public async logBulkActivities(activities: IActivityLog[]): Promise<void> {
    try {
      await connectToDatabase();
      await ActivityLog.insertMany(activities, { ordered: false });
    } catch (error) {
      console.error('Failed to log bulk activities:', error);
      // Add to offline queue
      activities.forEach(activity => this.addToOfflineQueue(activity));
    }
  }

  /**
   * Get session activities for a user
   */
  public getSessionActivities(sessionId: string): EnhancedLogContext[] {
    return this.sessionActivities.get(sessionId) || [];
  }

  /**
   * Clear session activities
   */
  public clearSessionActivities(sessionId: string): void {
    this.sessionActivities.delete(sessionId);
  }

  /**
   * Analyze user behavior patterns
   */
  public async analyzeUserBehavior(userId: string, days: number = 30): Promise<any> {
    try {
      await connectToDatabase();
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await ActivityLog.find({
        userId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: -1 });

      // Analyze patterns
      const analysis = {
        totalActivities: activities.length,
        averageActivitiesPerDay: activities.length / days,
        mostActiveHour: this.findMostActiveHour(activities),
        mostUsedFeatures: this.findMostUsedFeatures(activities),
        errorRate: this.calculateErrorRate(activities),
        averageResponseTime: this.calculateAverageResponseTime(activities),
        userJourneys: this.identifyUserJourneys(activities)
      };

      return analysis;
    } catch (error) {
      console.error('Failed to analyze user behavior:', error);
      return null;
    }
  }

  // Helper methods
  private parseDeviceInfo(userAgent: string): any {
    const device: any = {};

    // Device type detection
    if (/mobile/i.test(userAgent)) {
      device.type = 'mobile';
    } else if (/tablet/i.test(userAgent)) {
      device.type = 'tablet';
    } else {
      device.type = 'desktop';
    }

    // Browser detection
    if (/chrome/i.test(userAgent)) {
      device.browser = 'Chrome';
    } else if (/firefox/i.test(userAgent)) {
      device.browser = 'Firefox';
    } else if (/safari/i.test(userAgent)) {
      device.browser = 'Safari';
    } else if (/edge/i.test(userAgent)) {
      device.browser = 'Edge';
    }

    // OS detection
    if (/windows/i.test(userAgent)) {
      device.os = 'Windows';
    } else if (/mac/i.test(userAgent)) {
      device.os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      device.os = 'Linux';
    } else if (/android/i.test(userAgent)) {
      device.os = 'Android';
    } else if (/ios/i.test(userAgent)) {
      device.os = 'iOS';
    }

    return device;
  }

  private getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || '127.0.0.1';
  }

  private async getLocationFromIp(ipAddress: string): Promise<any> {
    // This would integrate with a geolocation service
    // For now, return mock data
    return {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      timezone: 'UTC'
    };
  }

  private addToOfflineQueue(activity: IActivityLog): void {
    this.offlineQueue.push(activity);
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('activityQueue', JSON.stringify(this.offlineQueue));
    }
  }

  private async flushOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    try {
      await this.logBulkActivities(this.offlineQueue);
      this.offlineQueue = [];
      if (typeof window !== 'undefined') {
        localStorage.removeItem('activityQueue');
      }
    } catch (error) {
      console.error('Failed to flush offline queue:', error);
    }
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.flushOfflineQueue();
  }

  private handleOffline(): void {
    this.isOnline = false;
  }

  private findMostActiveHour(activities: IActivityLog[]): number {
    const hourCounts: Record<number, number> = {};
    activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    let maxHour = 0;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = parseInt(hour);
      }
    });
    
    return maxHour;
  }

  private findMostUsedFeatures(activities: IActivityLog[]): any[] {
    const featureCounts: Record<string, number> = {};
    activities.forEach(activity => {
      const feature = `${activity.resourceType}:${activity.actionType}`;
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    });
    
    return Object.entries(featureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([feature, count]) => ({ feature, count }));
  }

  private calculateErrorRate(activities: IActivityLog[]): number {
    const errorCount = activities.filter(a => !a.success).length;
    return activities.length > 0 ? (errorCount / activities.length) * 100 : 0;
  }

  private calculateAverageResponseTime(activities: IActivityLog[]): number {
    const withResponseTime = activities.filter(a => a.responseTime);
    if (withResponseTime.length === 0) return 0;
    
    const total = withResponseTime.reduce((sum, a) => sum + (a.responseTime || 0), 0);
    return total / withResponseTime.length;
  }

  private identifyUserJourneys(activities: IActivityLog[]): any[] {
    // Simple journey identification based on time proximity
    const journeys: any[] = [];
    let currentJourney: IActivityLog[] = [];
    let lastTimestamp: Date | null = null;
    
    activities.forEach(activity => {
      const timestamp = new Date(activity.timestamp);
      if (lastTimestamp && timestamp.getTime() - lastTimestamp.getTime() > 30 * 60 * 1000) {
        // More than 30 minutes gap, new journey
        if (currentJourney.length > 0) {
          journeys.push({
            steps: currentJourney.length,
            duration: currentJourney[currentJourney.length - 1].timestamp.getTime() - currentJourney[0].timestamp.getTime(),
            startAction: `${currentJourney[0].resourceType}:${currentJourney[0].actionType}`,
            endAction: `${currentJourney[currentJourney.length - 1].resourceType}:${currentJourney[currentJourney.length - 1].actionType}`
          });
        }
        currentJourney = [activity];
      } else {
        currentJourney.push(activity);
      }
      lastTimestamp = timestamp;
    });
    
    // Add last journey
    if (currentJourney.length > 0) {
      journeys.push({
        steps: currentJourney.length,
        duration: currentJourney[currentJourney.length - 1].timestamp.getTime() - currentJourney[0].timestamp.getTime(),
        startAction: `${currentJourney[0].resourceType}:${currentJourney[0].actionType}`,
        endAction: `${currentJourney[currentJourney.length - 1].resourceType}:${currentJourney[currentJourney.length - 1].actionType}`
      });
    }
    
    return journeys;
  }
}

export const enhancedActivityLogger = EnhancedActivityLogger.getInstance();