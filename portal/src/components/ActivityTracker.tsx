'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trackPageView } from '@/middleware/activityTracking';

/**
 * Global activity tracker component
 * Place this in your root layout to track all page views automatically
 */
export default function ActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    // Track page view when pathname or search params change
    if (pathname) {
      trackPageView(pathname, searchParams, session?.user?.id);
    }
  }, [pathname, searchParams, session?.user?.id]);

  // Track session start
  useEffect(() => {
    if (session?.user?.id) {
      // Log session start
      fetch('/api/activity/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'session_start',
          resourceType: 'system',
          metadata: {
            sessionId: session.user.id,
            timestamp: new Date().toISOString()
          }
        })
      });

      // Log session end on unmount
      return () => {
        fetch('/api/activity/interaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'session_end',
            resourceType: 'system',
            metadata: {
              sessionId: session.user.id,
              timestamp: new Date().toISOString()
            }
          })
        });
      };
    }
  }, [session?.user?.id]);

  // Track browser events
  useEffect(() => {
    // Track window focus/blur
    const handleFocus = () => {
      if (session?.user?.id) {
        fetch('/api/activity/interaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'window_focus',
            resourceType: 'system',
            metadata: {
              pathname,
              timestamp: new Date().toISOString()
            }
          })
        });
      }
    };

    const handleBlur = () => {
      if (session?.user?.id) {
        fetch('/api/activity/interaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'window_blur',
            resourceType: 'system',
            metadata: {
              pathname,
              timestamp: new Date().toISOString()
            }
          })
        });
      }
    };

    // Track visibility changes
    const handleVisibilityChange = () => {
      if (session?.user?.id) {
        fetch('/api/activity/interaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: document.hidden ? 'page_hidden' : 'page_visible',
            resourceType: 'system',
            metadata: {
              pathname,
              hidden: document.hidden,
              timestamp: new Date().toISOString()
            }
          })
        });
      }
    };

    // Track before unload (page exit)
    const handleBeforeUnload = () => {
      if (session?.user?.id) {
        // Use sendBeacon for reliability on page unload
        const data = JSON.stringify({
          action: 'page_unload',
          resourceType: 'system',
          metadata: {
            pathname,
            timestamp: new Date().toISOString()
          }
        });
        navigator.sendBeacon('/api/activity/interaction', data);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, session?.user?.id]);

  // Track errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (session?.user?.id) {
        fetch('/api/activity/interaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'error',
            resourceType: 'system',
            metadata: {
              message: event.message,
              source: event.filename,
              line: event.lineno,
              column: event.colno,
              stack: event.error?.stack,
              pathname,
              timestamp: new Date().toISOString()
            }
          })
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (session?.user?.id) {
        fetch('/api/activity/interaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'error',
            resourceType: 'system',
            metadata: {
              type: 'unhandled_promise_rejection',
              reason: event.reason?.toString(),
              pathname,
              timestamp: new Date().toISOString()
            }
          })
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [pathname, session?.user?.id]);

  // No UI rendered - this is a tracking-only component
  return null;
}