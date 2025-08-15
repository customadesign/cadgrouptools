/**
 * Client-side activity tracking functions
 * These functions are safe to use in browser environments
 */

/**
 * Middleware for tracking page views and client-side navigation
 */
export async function trackPageView(
  pathname: string,
  searchParams: URLSearchParams | null,
  userId?: string
) {
  try {
    const response = await fetch('/api/activity/page-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pathname,
        searchParams: searchParams ? Object.fromEntries(searchParams) : {},
        userId,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      console.error('Failed to track page view:', response.statusText);
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

/**
 * Track client-side user interactions
 */
export async function trackUserInteraction(
  action: string,
  resourceType: string,
  metadata?: Record<string, any>
) {
  try {
    const response = await fetch('/api/activity/interaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        resourceType,
        metadata,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      console.error('Failed to track user interaction:', response.statusText);
    }
  } catch (error) {
    console.error('Error tracking user interaction:', error);
  }
}