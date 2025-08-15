import * as Sentry from '@sentry/nextjs';

// Initialize Sentry
export function initSentry() {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          'cadgrouptools.onrender.com',
          /^\//,
        ],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring
    profilesSampleRate: 0.1,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Before send hook for additional filtering
    beforeSend(event, hint) {
      // Filter out non-error events in development
      if (process.env.NODE_ENV === 'development' && event.level !== 'error') {
        return null;
      }
      
      // Don't send cancelled requests
      if (hint.originalException?.name === 'AbortError') {
        return null;
      }
      
      // Redact sensitive data
      if (event.request?.cookies) {
        event.request.cookies = '[Redacted]';
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Load failed',
      'ChunkLoadError',
    ],
  });
}

// User context helper
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    ip_address: '{{auto}}',
    role: user.role,
  });
}

// Clear user context
export function clearSentryUser() {
  Sentry.setUser(null);
}

// Custom error boundary
export function captureException(error: Error, context?: any) {
  console.error('Captured exception:', error);
  
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional', context);
    }
    Sentry.captureException(error);
  });
}

// Performance monitoring
export function startTransaction(name: string, op: string = 'navigation') {
  return Sentry.startTransaction({
    name,
    op,
  });
}

// Add breadcrumb
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: any
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}
