import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/performance';

// In-memory storage for metrics (replace with proper time-series DB in production)
const metricsBuffer: any[] = [];
const MAX_BUFFER_SIZE = 1000;

export async function POST(request: NextRequest) {
  try {
    // Parse metric data
    const metric = await request.json();
    
    // Add timestamp if not provided
    if (!metric.timestamp) {
      metric.timestamp = new Date().toISOString();
    }

    // Add to buffer
    metricsBuffer.push(metric);
    
    // Trim buffer if too large
    if (metricsBuffer.length > MAX_BUFFER_SIZE) {
      metricsBuffer.splice(0, metricsBuffer.length - MAX_BUFFER_SIZE);
    }

    // Log metric
    logger.info({
      type: 'metric-received',
      metric: metric.name,
      value: metric.value,
    }, `Metric received: ${metric.name}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to record metric', error);
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication - admin only
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const minutes = parseInt(searchParams.get('minutes') || '60');
    const metricName = searchParams.get('metric');

    // Calculate time threshold
    const threshold = new Date(Date.now() - minutes * 60 * 1000);

    // Filter metrics
    let filteredMetrics = metricsBuffer.filter(
      m => new Date(m.timestamp) >= threshold
    );

    if (metricName) {
      filteredMetrics = filteredMetrics.filter(m => m.name === metricName);
    }

    // Aggregate metrics
    const aggregated = aggregateMetrics(filteredMetrics);

    // Get current performance metrics
    const currentMetrics = performanceMonitor.getMetrics();

    // System metrics
    const systemMetrics = getSystemMetrics();

    return NextResponse.json({
      success: true,
      timeRange: {
        start: threshold.toISOString(),
        end: new Date().toISOString(),
        minutes,
      },
      metrics: {
        raw: filteredMetrics,
        aggregated,
        current: currentMetrics,
        system: systemMetrics,
      },
      summary: {
        totalMetrics: filteredMetrics.length,
        uniqueMetrics: new Set(filteredMetrics.map(m => m.name)).size,
        errorRate: calculateErrorRate(filteredMetrics),
        avgResponseTime: calculateAvgResponseTime(filteredMetrics),
      },
    });
  } catch (error) {
    logger.error('Failed to retrieve metrics', error);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}

function aggregateMetrics(metrics: any[]) {
  const aggregated: Record<string, any> = {};

  metrics.forEach(metric => {
    if (!aggregated[metric.name]) {
      aggregated[metric.name] = {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        values: [],
      };
    }

    const agg = aggregated[metric.name];
    agg.count++;
    agg.sum += metric.value;
    agg.min = Math.min(agg.min, metric.value);
    agg.max = Math.max(agg.max, metric.value);
    agg.values.push(metric.value);
  });

  // Calculate statistics
  Object.keys(aggregated).forEach(name => {
    const agg = aggregated[name];
    agg.avg = agg.sum / agg.count;
    agg.median = calculateMedian(agg.values);
    agg.p95 = calculatePercentile(agg.values, 0.95);
    agg.p99 = calculatePercentile(agg.values, 0.99);
    delete agg.values; // Remove raw values to save space
  });

  return aggregated;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * percentile) - 1;
  
  return sorted[index];
}

function calculateErrorRate(metrics: any[]): number {
  const requests = metrics.filter(m => m.name === 'api.request.duration');
  if (requests.length === 0) return 0;
  
  const errors = requests.filter(r => r.metadata?.error === true);
  return (errors.length / requests.length) * 100;
}

function calculateAvgResponseTime(metrics: any[]): number {
  const requests = metrics.filter(m => m.name === 'api.request.duration');
  if (requests.length === 0) return 0;
  
  const sum = requests.reduce((acc, r) => acc + r.value, 0);
  return sum / requests.length;
}

function getSystemMetrics() {
  const usage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    memory: {
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      rssMB: Math.round(usage.rss / 1024 / 1024),
      externalMB: Math.round(usage.external / 1024 / 1024),
    },
    process: {
      uptimeHours: Math.round(uptime / 3600 * 100) / 100,
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
    },
  };
}
