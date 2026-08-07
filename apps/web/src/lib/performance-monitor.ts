/**
 * Performance monitoring utilities for tracking response times and bottlenecks.
 *
 * Use in critical paths to identify slow operations.
 */

interface PerformanceMetric {
  path: string;
  duration: number;
  cacheHit?: boolean;
  timestamp: Date;
}

const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000; // Keep last 1000 metrics in memory

/**
 * Record a performance metric for an operation.
 * Metrics are stored in-memory; export periodically for analysis.
 */
export function recordMetric(
  path: string,
  durationMs: number,
  cacheHit?: boolean
): void {
  // Log slow operations immediately
  if (durationMs > 1000) {
    console.warn(`[perf] Slow operation: ${path} took ${durationMs}ms`, {
      cacheHit,
    });
  }

  metrics.push({
    path,
    duration: durationMs,
    cacheHit,
    timestamp: new Date(),
  });

  // Keep metrics bounded
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }
}

/**
 * Measure execution time of an async function.
 * Records metric automatically.
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  cacheHit?: boolean
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  recordMetric(name, Math.round(duration), cacheHit);
  return result;
}

/**
 * Measure execution time of a sync function.
 * Records metric automatically.
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  cacheHit?: boolean
): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  recordMetric(name, Math.round(duration), cacheHit);
  return result;
}

/**
 * Get performance statistics.
 */
export function getPerformanceStats(): {
  totalMetrics: number;
  slowestOperations: Array<{ path: string; duration: number }>;
  cacheHitRate: number;
  avgDuration: number;
} {
  if (metrics.length === 0) {
    return {
      totalMetrics: 0,
      slowestOperations: [],
      cacheHitRate: 0,
      avgDuration: 0,
    };
  }

  const sorted = [...metrics].sort((a, b) => b.duration - a.duration);
  const slowest = sorted.slice(0, 5);

  const cacheHits = metrics.filter((m) => m.cacheHit).length;
  const avgDuration =
    metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;

  return {
    totalMetrics: metrics.length,
    slowestOperations: slowest.map((m) => ({
      path: m.path,
      duration: m.duration,
    })),
    cacheHitRate: Math.round((cacheHits / metrics.length) * 100),
    avgDuration: Math.round(avgDuration),
  };
}

/**
 * Clear all metrics.
 * Call periodically or after exporting for analysis.
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Export metrics as JSON for external analysis.
 */
export function exportMetrics(): string {
  return JSON.stringify(
    {
      metrics,
      stats: getPerformanceStats(),
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}
