import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trackPageView, trackUserInteraction } from '@/lib/clientActivityTracking';

/**
 * Hook to automatically track page views
 */
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname, searchParams, session?.user?.id);
    }
  }, [pathname, searchParams, session?.user?.id]);
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking() {
  const { data: session } = useSession();

  const trackInteraction = (
    action: string,
    resourceType: string,
    metadata?: Record<string, any>
  ) => {
    trackUserInteraction(action, resourceType, {
      ...metadata,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    });
  };

  return { trackInteraction };
}

/**
 * Track button clicks
 */
export function trackButtonClick(buttonName: string, metadata?: Record<string, any>) {
  trackUserInteraction('click', 'ui', {
    element: 'button',
    name: buttonName,
    ...metadata
  });
}

/**
 * Track form submissions
 */
export function trackFormSubmission(formName: string, metadata?: Record<string, any>) {
  trackUserInteraction('submit', 'form', {
    formName,
    ...metadata
  });
}

/**
 * Track search queries
 */
export function trackSearch(query: string, resultCount?: number, filters?: Record<string, any>) {
  trackUserInteraction('search', 'system', {
    query,
    resultCount,
    filters
  });
}

/**
 * Track file operations
 */
export function trackFileOperation(
  operation: 'upload' | 'download' | 'delete' | 'view',
  fileName: string,
  fileType?: string,
  fileSize?: number
) {
  trackUserInteraction(operation, 'file', {
    fileName,
    fileType,
    fileSize
  });
}

/**
 * Track report generation
 */
export function trackReportGeneration(
  reportType: string,
  format: string,
  filters?: Record<string, any>
) {
  trackUserInteraction('generate', 'report', {
    reportType,
    format,
    filters
  });
}

/**
 * Track errors
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  context?: Record<string, any>
) {
  trackUserInteraction('error', 'system', {
    errorType,
    errorMessage,
    ...context
  });
}