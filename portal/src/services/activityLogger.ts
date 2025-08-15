import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/db';
import ActivityLog, { IActivityLog } from '@/models/ActivityLog';

export interface LogContext {
  actionType: IActivityLog['actionType'];
  resourceType: IActivityLog['resourceType'];
  resourceId?: string;
  resourceName?: string;
  metadata?: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

export class ActivityLogger {
  private static instance: ActivityLogger;
  private writeQueue: IActivityLog[] = [];
  private isProcessing = false;
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    // Start the batch processing interval
    this.startBatchProcessor();
  }

  public static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  private startBatchProcessor() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.processBatch();
    }, this.flushInterval);
  }

  private async processBatch() {
    if (this.isProcessing || this.writeQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.writeQueue.splice(0, this.batchSize);

    try {
      await connectToDatabase();
      await ActivityLog.insertMany(batch, { ordered: false });
    } catch (error) {
      console.error('Failed to write activity logs batch:', error);
      // In production, you might want to implement a retry mechanism
      // or write to a fallback storage
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Extract client IP address from request headers
   */
  private getClientIp(request: NextRequest): string {
    // Check various headers for the real IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }

    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    // Fallback to localhost if no IP found
    return '127.0.0.1';
  }

  /**
   * Parse user agent for browser and OS information
   */
  private parseUserAgent(userAgent: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Simple browser detection
    if (userAgent.includes('Chrome')) {
      metadata.browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      metadata.browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      metadata.browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      metadata.browser = 'Edge';
    }

    // Simple OS detection
    if (userAgent.includes('Windows')) {
      metadata.os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      metadata.os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      metadata.os = 'Linux';
    } else if (userAgent.includes('Android')) {
      metadata.os = 'Android';
    } else if (userAgent.includes('iOS')) {
      metadata.os = 'iOS';
    }

    return metadata;
  }

  /**
   * Log an activity with automatic session detection
   */
  public async logActivity(
    request: NextRequest,
    context: LogContext,
    response: {
      success: boolean;
      statusCode: number;
      errorMessage?: string;
      responseTime?: number;
    }
  ): Promise<void> {
    try {
      // Get user session
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        // For unauthenticated requests, we might still want to log certain activities
        if (context.resourceType === 'auth') {
          // Log auth attempts even without a session
          const logEntry: IActivityLog = {
            userId: 'anonymous',
            userName: 'Anonymous',
            userEmail: 'anonymous@system',
            userRole: 'staff' as any,
            actionType: context.actionType,
            resourceType: context.resourceType,
            resourceId: context.resourceId,
            resourceName: context.resourceName,
            method: request.method as any,
            endpoint: request.nextUrl.pathname,
            ipAddress: this.getClientIp(request),
            userAgent: request.headers.get('user-agent') || 'Unknown',
            timestamp: new Date(),
            success: response.success,
            errorMessage: response.errorMessage,
            statusCode: response.statusCode,
            responseTime: response.responseTime,
            metadata: {
              ...context.metadata,
              ...this.parseUserAgent(request.headers.get('user-agent') || '')
            },
            changes: context.changes
          };
          
          this.writeQueue.push(logEntry);
        }
        return;
      }

      const logEntry: IActivityLog = {
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        userEmail: session.user.email,
        userRole: session.user.role as any,
        actionType: context.actionType,
        resourceType: context.resourceType,
        resourceId: context.resourceId,
        resourceName: context.resourceName,
        method: request.method as any,
        endpoint: request.nextUrl.pathname,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'Unknown',
        timestamp: new Date(),
        success: response.success,
        errorMessage: response.errorMessage,
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        metadata: {
          ...context.metadata,
          ...this.parseUserAgent(request.headers.get('user-agent') || '')
        },
        changes: context.changes
      };

      // Add to write queue for batch processing
      this.writeQueue.push(logEntry);

      // If queue is getting large, process immediately
      if (this.writeQueue.length >= this.batchSize * 2) {
        this.processBatch();
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging failures shouldn't break the application
    }
  }

  /**
   * Log an activity with explicit user information (useful for system operations)
   */
  public async logSystemActivity(
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    },
    context: LogContext & {
      method: string;
      endpoint: string;
      ipAddress?: string;
      userAgent?: string;
    },
    response: {
      success: boolean;
      statusCode: number;
      errorMessage?: string;
      responseTime?: number;
    }
  ): Promise<void> {
    try {
      const logEntry: IActivityLog = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role as any,
        actionType: context.actionType,
        resourceType: context.resourceType,
        resourceId: context.resourceId,
        resourceName: context.resourceName,
        method: context.method as any,
        endpoint: context.endpoint,
        ipAddress: context.ipAddress || '127.0.0.1',
        userAgent: context.userAgent || 'System',
        timestamp: new Date(),
        success: response.success,
        errorMessage: response.errorMessage,
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        metadata: context.metadata,
        changes: context.changes
      };

      this.writeQueue.push(logEntry);

      // If queue is getting large, process immediately
      if (this.writeQueue.length >= this.batchSize * 2) {
        this.processBatch();
      }
    } catch (error) {
      console.error('Failed to log system activity:', error);
    }
  }

  /**
   * Force flush all pending logs
   */
  public async flush(): Promise<void> {
    await this.processBatch();
  }

  /**
   * Cleanup method for graceful shutdown
   */
  public async shutdown(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    await this.flush();
  }
}

// Export singleton instance
export const activityLogger = ActivityLogger.getInstance();

// Helper function for easy logging in API routes
export async function withActivityLogging<T>(
  request: NextRequest,
  context: LogContext,
  handler: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  let statusCode = 200;
  let success = true;
  let errorMessage: string | undefined;
  let result: T;

  try {
    result = await handler();
    return result;
  } catch (error) {
    success = false;
    statusCode = 500;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  } finally {
    const responseTime = Date.now() - startTime;
    
    await activityLogger.logActivity(
      request,
      context,
      {
        success,
        statusCode,
        errorMessage,
        responseTime
      }
    );
  }
}