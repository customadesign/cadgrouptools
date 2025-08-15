import { NextRequest, NextResponse } from 'next/server';
import { activityLogger, LogContext } from '@/services/activityLogger';

/**
 * Higher-order function to wrap API route handlers with activity logging
 * 
 * @param handler - The original route handler
 * @param getContext - Function to extract logging context from the request
 * @returns Wrapped handler with automatic activity logging
 */
export function withActivityLogging<T extends any[], R>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse | R>,
  getContext: (req: NextRequest, ...args: T) => LogContext | Promise<LogContext>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse | R> => {
    const startTime = Date.now();
    let response: NextResponse | R;
    let statusCode = 200;
    let success = true;
    let errorMessage: string | undefined;

    try {
      // Get the logging context
      const context = await getContext(req, ...args);
      
      // Execute the handler
      response = await handler(req, ...args);
      
      // Extract status code if response is NextResponse
      if (response instanceof NextResponse) {
        statusCode = response.status;
        success = statusCode < 400;
        
        // Try to extract error message from error responses
        if (!success) {
          try {
            const responseClone = response.clone();
            const body = await responseClone.json();
            errorMessage = body.error || body.message;
          } catch {
            // Ignore if we can't parse the response
          }
        }
      }
      
      // Log the activity
      const responseTime = Date.now() - startTime;
      await activityLogger.logActivity(
        req,
        context,
        {
          success,
          statusCode,
          errorMessage,
          responseTime
        }
      ).catch(err => {
        console.error('Failed to log activity:', err);
      });
      
      return response;
    } catch (error) {
      // Log the error
      success = false;
      statusCode = 500;
      errorMessage = error instanceof Error ? error.message : 'Internal server error';
      
      const responseTime = Date.now() - startTime;
      
      // Get context for error logging
      const context = await getContext(req, ...args);
      
      await activityLogger.logActivity(
        req,
        context,
        {
          success,
          statusCode,
          errorMessage,
          responseTime
        }
      ).catch(err => {
        console.error('Failed to log activity:', err);
      });
      
      // Re-throw the error to maintain normal error handling
      throw error;
    }
  };
}

/**
 * Utility to extract resource ID from URL path
 */
export function extractResourceId(pathname: string, pattern: RegExp): string | undefined {
  const match = pathname.match(pattern);
  return match ? match[1] : undefined;
}

/**
 * Common context extractors for different resource types
 */
export const contextExtractors = {
  client: (req: NextRequest): LogContext => {
    const method = req.method;
    const pathname = req.nextUrl.pathname;
    const clientId = extractResourceId(pathname, /\/api\/clients\/([^\/]+)/);
    
    return {
      actionType: method === 'GET' ? 'view' :
                  method === 'POST' ? 'create' :
                  method === 'PUT' || method === 'PATCH' ? 'update' :
                  method === 'DELETE' ? 'delete' : 'view',
      resourceType: 'client',
      resourceId: clientId
    };
  },
  
  proposal: (req: NextRequest): LogContext => {
    const method = req.method;
    const pathname = req.nextUrl.pathname;
    const proposalId = extractResourceId(pathname, /\/api\/proposals\/([^\/]+)/);
    
    return {
      actionType: pathname.includes('/generate') ? 'generate' :
                  method === 'GET' ? 'view' :
                  method === 'POST' ? 'create' :
                  method === 'PUT' || method === 'PATCH' ? 'update' :
                  method === 'DELETE' ? 'delete' : 'view',
      resourceType: 'proposal',
      resourceId: proposalId
    };
  },
  
  user: (req: NextRequest): LogContext => {
    const method = req.method;
    const pathname = req.nextUrl.pathname;
    const userId = extractResourceId(pathname, /\/api\/admin\/users\/([^\/]+)/);
    
    return {
      actionType: method === 'GET' ? 'view' :
                  method === 'POST' ? 'create' :
                  method === 'PUT' || method === 'PATCH' ? 'update' :
                  method === 'DELETE' ? 'delete' : 'view',
      resourceType: 'user',
      resourceId: userId
    };
  },
  
  file: (req: NextRequest): LogContext => {
    const method = req.method;
    
    return {
      actionType: method === 'GET' ? 'download' : 'upload',
      resourceType: 'file'
    };
  },
  
  transaction: (req: NextRequest): LogContext => {
    const method = req.method;
    const pathname = req.nextUrl.pathname;
    const transactionId = extractResourceId(pathname, /\/api\/transactions\/([^\/]+)/);
    
    return {
      actionType: method === 'GET' ? 'view' :
                  method === 'POST' ? 'create' :
                  method === 'PUT' || method === 'PATCH' ? 'update' :
                  method === 'DELETE' ? 'delete' : 'view',
      resourceType: 'transaction',
      resourceId: transactionId
    };
  }
};