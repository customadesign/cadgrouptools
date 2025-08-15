import { NextRequest, NextResponse } from 'next/server';
import { activityLogger, LogContext } from '@/services/activityLogger';

/**
 * Map URL patterns to activity contexts
 */
function getActivityContext(pathname: string, method: string): LogContext | null {
  // Authentication routes
  if (pathname === '/api/auth/register' && method === 'POST') {
    return {
      actionType: 'create',
      resourceType: 'auth',
      metadata: { action: 'user_registration' }
    };
  }
  
  if (pathname.includes('/api/auth') && pathname.includes('signin')) {
    return {
      actionType: 'login',
      resourceType: 'auth',
      metadata: { action: 'user_login' }
    };
  }

  if (pathname.includes('/api/auth') && pathname.includes('signout')) {
    return {
      actionType: 'logout',
      resourceType: 'auth',
      metadata: { action: 'user_logout' }
    };
  }

  // User management routes
  if (pathname.startsWith('/api/admin/users')) {
    const actionType = method === 'GET' ? 'view' : 
                      method === 'POST' ? 'create' :
                      method === 'PUT' || method === 'PATCH' ? 'update' :
                      method === 'DELETE' ? 'delete' : 'view';
    return {
      actionType: actionType as any,
      resourceType: 'user'
    };
  }

  // Client routes
  if (pathname.startsWith('/api/clients')) {
    const actionType = method === 'GET' ? 'view' : 
                      method === 'POST' ? 'create' :
                      method === 'PUT' || method === 'PATCH' ? 'update' :
                      method === 'DELETE' ? 'delete' : 'view';
    
    // Extract client ID if present
    const clientIdMatch = pathname.match(/\/api\/clients\/([^\/]+)/);
    return {
      actionType: actionType as any,
      resourceType: 'client',
      resourceId: clientIdMatch ? clientIdMatch[1] : undefined
    };
  }

  // Proposal routes
  if (pathname.startsWith('/api/proposals')) {
    const actionType = pathname.includes('/generate') ? 'generate' :
                      method === 'GET' ? 'view' : 
                      method === 'POST' ? 'create' :
                      method === 'PUT' || method === 'PATCH' ? 'update' :
                      method === 'DELETE' ? 'delete' : 'view';
    
    const proposalIdMatch = pathname.match(/\/api\/proposals\/([^\/]+)/);
    return {
      actionType: actionType as any,
      resourceType: 'proposal',
      resourceId: proposalIdMatch ? proposalIdMatch[1] : undefined
    };
  }

  // File upload/download routes
  if (pathname.startsWith('/api/uploads')) {
    return {
      actionType: method === 'GET' ? 'download' : 'upload',
      resourceType: 'file'
    };
  }

  // Transaction routes
  if (pathname.includes('/api/transactions') || pathname.includes('/api/statements')) {
    const actionType = method === 'GET' ? 'view' : 
                      method === 'POST' ? 'create' :
                      method === 'PUT' || method === 'PATCH' ? 'update' :
                      method === 'DELETE' ? 'delete' : 'view';
    return {
      actionType: actionType as any,
      resourceType: pathname.includes('transactions') ? 'transaction' : 'statement'
    };
  }

  // OCR routes
  if (pathname.startsWith('/api/ocr')) {
    return {
      actionType: 'generate',
      resourceType: 'file',
      metadata: { operation: 'ocr_processing' }
    };
  }

  // Default: don't log
  return null;
}

/**
 * Activity logging middleware wrapper for API routes
 */
export function withActivityLog(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const context = getActivityContext(req.nextUrl.pathname, req.method);
    
    // Skip logging if no context found (not a monitored route)
    if (!context) {
      return handler(req);
    }

    let response: NextResponse;
    let statusCode = 200;
    let success = true;
    let errorMessage: string | undefined;

    try {
      response = await handler(req);
      statusCode = response.status;
      success = statusCode < 400;
      
      // Try to extract error message from response if it's an error
      if (!success) {
        try {
          const responseClone = response.clone();
          const body = await responseClone.json();
          errorMessage = body.error || body.message;
        } catch {
          // Ignore if we can't parse the response
        }
      }
      
      return response;
    } catch (error) {
      success = false;
      statusCode = 500;
      errorMessage = error instanceof Error ? error.message : 'Internal server error';
      
      // Re-throw the error to maintain normal error handling
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      
      // Log the activity asynchronously (don't wait for it)
      activityLogger.logActivity(
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
    }
  };
}

/**
 * Enhanced middleware for specific resource types with detailed logging
 */
export function withDetailedActivityLog(
  resourceType: LogContext['resourceType'],
  getResourceDetails?: (req: NextRequest) => Promise<{
    resourceId?: string;
    resourceName?: string;
    metadata?: Record<string, any>;
  }>
) {
  return function(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const startTime = Date.now();
      
      // Determine action type based on method
      const actionType = req.method === 'GET' ? 'view' : 
                        req.method === 'POST' ? 'create' :
                        req.method === 'PUT' || req.method === 'PATCH' ? 'update' :
                        req.method === 'DELETE' ? 'delete' : 'view';
      
      let context: LogContext = {
        actionType: actionType as any,
        resourceType
      };

      // Get additional resource details if provider function is given
      if (getResourceDetails) {
        try {
          const details = await getResourceDetails(req);
          context = { ...context, ...details };
        } catch (error) {
          console.error('Failed to get resource details:', error);
        }
      }

      let response: NextResponse;
      let statusCode = 200;
      let success = true;
      let errorMessage: string | undefined;

      try {
        response = await handler(req);
        statusCode = response.status;
        success = statusCode < 400;
        
        if (!success) {
          try {
            const responseClone = response.clone();
            const body = await responseClone.json();
            errorMessage = body.error || body.message;
          } catch {
            // Ignore if we can't parse the response
          }
        }
        
        return response;
      } catch (error) {
        success = false;
        statusCode = 500;
        errorMessage = error instanceof Error ? error.message : 'Internal server error';
        
        // Create error response
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      } finally {
        const responseTime = Date.now() - startTime;
        
        // Log the activity asynchronously
        activityLogger.logActivity(
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
      }
    };
  };
}