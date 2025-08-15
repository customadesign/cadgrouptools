import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { activityLogger, LogContext } from '@/services/activityLogger';

export interface TrackedRouteConfig {
  actionType: LogContext['actionType'];
  resourceType: LogContext['resourceType'];
  extractResourceInfo?: (req: NextRequest, body?: any) => Promise<{
    resourceId?: string;
    resourceName?: string;
    metadata?: Record<string, any>;
  }>;
  skipLogging?: (req: NextRequest) => boolean;
  captureChanges?: boolean;
}

// Route configurations for automatic activity tracking
export const routeConfigurations: Record<string, TrackedRouteConfig> = {
  // Authentication routes
  '/api/auth/register': {
    actionType: 'create',
    resourceType: 'auth',
    extractResourceInfo: async (req, body) => ({
      resourceName: 'User Registration',
      metadata: { email: body?.email, role: body?.role }
    })
  },
  '/api/auth/[...nextauth]': {
    actionType: 'login',
    resourceType: 'auth',
    skipLogging: (req) => !req.url?.includes('callback/credentials')
  },
  
  // Client routes
  '/api/clients': {
    actionType: 'create',
    resourceType: 'client',
    extractResourceInfo: async (req, body) => ({
      resourceName: body?.name || 'New Client',
      metadata: { 
        industry: body?.industry,
        type: body?.type,
        status: body?.status 
      }
    })
  },
  '/api/clients/[id]': {
    actionType: 'update',
    resourceType: 'client',
    extractResourceInfo: async (req) => {
      const id = req.nextUrl.pathname.split('/').pop();
      return {
        resourceId: id,
        metadata: { method: req.method }
      };
    },
    captureChanges: true
  },
  
  // Proposal routes
  '/api/proposals': {
    actionType: 'create',
    resourceType: 'proposal',
    extractResourceInfo: async (req, body) => ({
      resourceName: body?.title || 'New Proposal',
      metadata: {
        clientId: body?.clientId,
        value: body?.value,
        status: body?.status
      }
    })
  },
  '/api/proposals/[id]': {
    actionType: 'update',
    resourceType: 'proposal',
    extractResourceInfo: async (req) => {
      const pathParts = req.nextUrl.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      return {
        resourceId: id,
        metadata: { method: req.method }
      };
    },
    captureChanges: true
  },
  '/api/proposals/[id]/generate': {
    actionType: 'generate',
    resourceType: 'proposal',
    extractResourceInfo: async (req) => {
      const pathParts = req.nextUrl.pathname.split('/');
      const id = pathParts[pathParts.length - 2];
      return {
        resourceId: id,
        resourceName: 'Proposal Generation',
        metadata: { action: 'generate_pdf' }
      };
    }
  },
  
  // Transaction routes
  '/api/transactions': {
    actionType: 'create',
    resourceType: 'transaction',
    extractResourceInfo: async (req, body) => ({
      resourceName: body?.description || 'New Transaction',
      metadata: {
        type: body?.type,
        amount: body?.amount,
        category: body?.category,
        status: body?.status
      }
    })
  },
  '/api/transactions/[id]': {
    actionType: 'update',
    resourceType: 'transaction',
    extractResourceInfo: async (req) => {
      const id = req.nextUrl.pathname.split('/').pop();
      return {
        resourceId: id,
        metadata: { method: req.method }
      };
    },
    captureChanges: true
  },
  
  // Statement routes
  '/api/statements': {
    actionType: 'create',
    resourceType: 'statement',
    extractResourceInfo: async (req, body) => ({
      resourceName: body?.title || 'New Statement',
      metadata: {
        clientId: body?.clientId,
        period: body?.period,
        status: body?.status
      }
    })
  },
  '/api/statements/[id]': {
    actionType: 'update',
    resourceType: 'statement',
    extractResourceInfo: async (req) => {
      const id = req.nextUrl.pathname.split('/').pop();
      return {
        resourceId: id,
        metadata: { method: req.method }
      };
    },
    captureChanges: true
  },
  
  // File upload routes
  '/api/uploads/presign': {
    actionType: 'upload',
    resourceType: 'file',
    extractResourceInfo: async (req, body) => ({
      resourceName: body?.fileName || 'File Upload',
      metadata: {
        fileType: body?.fileType,
        fileSize: body?.fileSize,
        purpose: body?.purpose
      }
    })
  },
  
  // OCR route
  '/api/ocr': {
    actionType: 'generate',
    resourceType: 'file',
    extractResourceInfo: async (req, body) => ({
      resourceName: 'OCR Processing',
      metadata: {
        fileName: body?.fileName,
        pageCount: body?.pageCount
      }
    })
  },
  
  // Admin routes
  '/api/admin/users': {
    actionType: 'create',
    resourceType: 'user',
    extractResourceInfo: async (req, body) => ({
      resourceName: body?.email || 'User Management',
      metadata: {
        action: req.method === 'POST' ? 'create_user' : 'list_users',
        role: body?.role
      }
    })
  },
  '/api/admin/users/reset-password': {
    actionType: 'update',
    resourceType: 'user',
    extractResourceInfo: async (req, body) => ({
      resourceId: body?.userId,
      resourceName: 'Password Reset',
      metadata: { email: body?.email }
    })
  },
  '/api/admin/users/bulk': {
    actionType: 'create',
    resourceType: 'user',
    extractResourceInfo: async (req, body) => ({
      resourceName: 'Bulk User Operation',
      metadata: {
        operation: body?.operation,
        userCount: body?.users?.length
      }
    })
  },
  
  // Report/Export routes
  '/api/admin/activity-logs': {
    actionType: 'view',
    resourceType: 'report',
    extractResourceInfo: async (req) => ({
      resourceName: 'Activity Logs',
      metadata: {
        filters: Object.fromEntries(req.nextUrl.searchParams)
      }
    })
  },
  '/api/admin/activity-logs/stats': {
    actionType: 'view',
    resourceType: 'report',
    extractResourceInfo: async (req) => ({
      resourceName: 'Activity Statistics',
      metadata: {
        dateRange: {
          startDate: req.nextUrl.searchParams.get('startDate'),
          endDate: req.nextUrl.searchParams.get('endDate')
        }
      }
    })
  },
  '/api/admin/activity-logs/export': {
    actionType: 'export',
    resourceType: 'report',
    extractResourceInfo: async (req) => ({
      resourceName: 'Activity Log Export',
      metadata: {
        format: req.nextUrl.searchParams.get('format'),
        dateRange: {
          startDate: req.nextUrl.searchParams.get('startDate'),
          endDate: req.nextUrl.searchParams.get('endDate')
        }
      }
    })
  },
  
  // Notification routes
  '/api/notifications/subscribe': {
    actionType: 'create',
    resourceType: 'system',
    extractResourceInfo: async (req) => ({
      resourceName: 'Push Notification Subscription',
      metadata: { action: 'subscribe' }
    })
  },
  '/api/notifications/send': {
    actionType: 'create',
    resourceType: 'system',
    extractResourceInfo: async (req, body) => ({
      resourceName: 'Send Notification',
      metadata: {
        targetUsers: body?.targetUsers,
        title: body?.title,
        notificationType: body?.type
      }
    })
  }
};

/**
 * Wraps an API route handler with automatic activity logging
 */
export function withActivityTracking<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  config?: Partial<TrackedRouteConfig>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();
    
    let response: R;
    let statusCode = 200;
    let success = true;
    let errorMessage: string | undefined;
    let body: any;
    
    // Try to parse request body if it's a POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method || '')) {
      try {
        const clonedRequest = request.clone();
        body = await clonedRequest.json();
      } catch {
        // Body might not be JSON or might be empty
      }
    }
    
    // Get route configuration
    const pathname = request.nextUrl.pathname;
    const routePattern = findMatchingRoutePattern(pathname);
    const routeConfig = routePattern ? routeConfigurations[routePattern] : undefined;
    const finalConfig = { ...routeConfig, ...config };
    
    // Skip logging if configured to do so
    if (finalConfig?.skipLogging?.(request)) {
      return handler(...args);
    }
    
    try {
      // Execute the handler
      response = await handler(...args);
      
      // Extract status code from NextResponse if available
      if (response && typeof response === 'object' && 'status' in response) {
        statusCode = (response as any).status;
        success = statusCode >= 200 && statusCode < 400;
      }
      
      return response;
    } catch (error) {
      success = false;
      statusCode = 500;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      // Log the activity
      if (finalConfig) {
        const responseTime = Date.now() - startTime;
        
        // Extract resource information
        const resourceInfo = await finalConfig.extractResourceInfo?.(request, body) || {};
        
        // Determine action type based on method if not specified
        let actionType = finalConfig.actionType;
        if (!actionType) {
          const methodMap: Record<string, LogContext['actionType']> = {
            'GET': 'view',
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete'
          };
          actionType = methodMap[request.method || 'GET'] || 'view';
        }
        
        await activityLogger.logActivity(
          request,
          {
            actionType,
            resourceType: finalConfig.resourceType || 'system',
            ...resourceInfo,
            metadata: {
              ...resourceInfo.metadata,
              method: request.method,
              path: pathname,
              queryParams: Object.fromEntries(request.nextUrl.searchParams),
              responseTime
            }
          },
          {
            success,
            statusCode,
            errorMessage,
            responseTime
          }
        );
      }
    }
  };
}

/**
 * Find matching route pattern for a given pathname
 */
function findMatchingRoutePattern(pathname: string): string | undefined {
  // First try exact match
  if (routeConfigurations[pathname]) {
    return pathname;
  }
  
  // Then try pattern matching for dynamic routes
  for (const pattern of Object.keys(routeConfigurations)) {
    if (pattern.includes('[')) {
      // Convert route pattern to regex
      const regexPattern = pattern
        .replace(/\[([^\]]+)\]/g, '([^/]+)')
        .replace(/\//g, '\\/')
        + '$';
      
      const regex = new RegExp(regexPattern);
      if (regex.test(pathname)) {
        return pattern;
      }
    }
  }
  
  return undefined;
}

