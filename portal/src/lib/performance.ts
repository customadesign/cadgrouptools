import { logger } from './logger';

interface PerformanceMark {
  name: string;
  startTime: number;
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private metrics: PerformanceMetric[] = [];

  // Start a performance measurement
  startMeasure(name: string, metadata?: Record<string, any>): void {
    this.marks.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  // End a performance measurement and log it
  endMeasure(name: string): number | null {
    const mark = this.marks.get(name);
    if (!mark) {
      logger.warn(`No performance mark found for: ${name}`);
      return null;
    }

    const duration = performance.now() - mark.startTime;
    this.marks.delete(name);

    // Log the measurement
    logger.info({
      type: 'performance',
      measurement: name,
      duration: Math.round(duration),
      unit: 'ms',
      ...mark.metadata,
    }, `Performance: ${name} took ${Math.round(duration)}ms`);

    // Store metric
    this.metrics.push({
      name,
      value: duration,
      unit: 'ms',
      metadata: mark.metadata,
    });

    // Send to monitoring service if configured
    this.reportMetric(name, duration, mark.metadata);

    return duration;
  }

  // Record a custom metric
  recordMetric(name: string, value: number, unit: string = 'count', metadata?: Record<string, any>): void {
    this.metrics.push({
      name,
      value,
      unit,
      metadata,
    });

    logger.info({
      type: 'metric',
      metric: name,
      value,
      unit,
      ...metadata,
    }, `Metric: ${name} = ${value} ${unit}`);

    this.reportMetric(name, value, metadata);
  }

  // Get all recorded metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    this.marks.clear();
  }

  // Report metric to external monitoring service
  private reportMetric(name: string, value: number, metadata?: Record<string, any>): void {
    // In production, send to monitoring service like DataDog, New Relic, etc.
    if (process.env.NODE_ENV === 'production' && process.env.MONITORING_ENABLED === 'true') {
      // Example: Send to monitoring endpoint
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          value,
          timestamp: new Date().toISOString(),
          metadata,
        }),
      }).catch(error => {
        logger.error('Failed to report metric', error);
      });
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  performanceMonitor.startMeasure(name, metadata);
  
  return fn()
    .then(result => {
      performanceMonitor.endMeasure(name);
      return result;
    })
    .catch(error => {
      performanceMonitor.endMeasure(name);
      throw error;
    });
}

export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  performanceMonitor.startMeasure(name, metadata);
  
  try {
    const result = fn();
    performanceMonitor.endMeasure(name);
    return result;
  } catch (error) {
    performanceMonitor.endMeasure(name);
    throw error;
  }
}

// Web Vitals monitoring
export function reportWebVitals(metric: any): void {
  const { name, value, rating } = metric;
  
  performanceMonitor.recordMetric(`web-vitals.${name}`, value, 'ms', {
    rating,
    metric: name,
  });

  // Log poor performance
  if (rating === 'poor') {
    logger.warn({
      type: 'web-vitals',
      metric: name,
      value,
      rating,
    }, `Poor Web Vital: ${name} = ${value}ms`);
  }
}

// API Route timing middleware
export function withPerformanceTracking(
  handler: (req: any, res: any) => Promise<void>,
  routeName: string
) {
  return async (req: any, res: any) => {
    const start = Date.now();
    const method = req.method || 'GET';
    
    try {
      await handler(req, res);
      
      const duration = Date.now() - start;
      performanceMonitor.recordMetric('api.request.duration', duration, 'ms', {
        route: routeName,
        method,
        status: res.statusCode || 200,
      });
      
      // Log slow requests
      if (duration > 1000) {
        logger.warn({
          type: 'slow-request',
          route: routeName,
          method,
          duration,
        }, `Slow API request: ${method} ${routeName} took ${duration}ms`);
      }
    } catch (error) {
      const duration = Date.now() - start;
      performanceMonitor.recordMetric('api.request.duration', duration, 'ms', {
        route: routeName,
        method,
        status: 500,
        error: true,
      });
      throw error;
    }
  };
}

// Database query tracking
export function trackDatabaseQuery(
  operation: string,
  collection: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  performanceMonitor.recordMetric('database.query.duration', duration, 'ms', {
    operation,
    collection,
    ...metadata,
  });

  // Log slow queries
  if (duration > 100) {
    logger.warn({
      type: 'slow-query',
      operation,
      collection,
      duration,
      ...metadata,
    }, `Slow database query: ${operation} on ${collection} took ${duration}ms`);
  }
}

// Memory usage tracking
export function trackMemoryUsage(): void {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    
    performanceMonitor.recordMetric('memory.heap.used', usage.heapUsed, 'bytes');
    performanceMonitor.recordMetric('memory.heap.total', usage.heapTotal, 'bytes');
    performanceMonitor.recordMetric('memory.rss', usage.rss, 'bytes');
    performanceMonitor.recordMetric('memory.external', usage.external, 'bytes');
    
    // Alert on high memory usage
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 512) {
      logger.warn({
        type: 'high-memory',
        heapUsedMB: Math.round(heapUsedMB),
        heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      }, `High memory usage: ${Math.round(heapUsedMB)}MB heap used`);
    }
  }
}

// Start periodic memory tracking
if (process.env.NODE_ENV === 'production') {
  setInterval(trackMemoryUsage, 60000); // Every minute
}

export default performanceMonitor;
