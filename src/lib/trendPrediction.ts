/**
 * Trend prediction & statistical utilities for analytics.
 * Provides linear regression, moving averages, and growth forecasting.
 */

export interface DataPoint {
  date: string;
  value: number;
}

export interface TrendResult {
  slope: number;
  intercept: number;
  r2: number;
  direction: "up" | "down" | "stable";
  predictedNext: number;
  percentChange: number;
}

/**
 * Simple linear regression on time-series data.
 */
export function linearRegression(points: DataPoint[]): TrendResult {
  const n = points.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, r2: 0, direction: "stable", predictedNext: 0, percentChange: 0 };
  }

  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.value);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const meanY = sumY / n;
  const ssRes = ys.reduce((a, y, i) => a + (y - (slope * xs[i] + intercept)) ** 2, 0);
  const ssTot = ys.reduce((a, y) => a + (y - meanY) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  const predictedNext = slope * n + intercept;
  const lastVal = ys[ys.length - 1];
  const percentChange = lastVal === 0 ? 0 : ((predictedNext - lastVal) / lastVal) * 100;

  const direction: TrendResult["direction"] =
    Math.abs(slope) < 0.01 ? "stable" : slope > 0 ? "up" : "down";

  return { slope, intercept, r2, direction, predictedNext, percentChange };
}

/**
 * Simple Moving Average with configurable window.
 */
export function movingAverage(points: DataPoint[], window = 3): DataPoint[] {
  if (points.length < window) return points;

  return points.slice(window - 1).map((p, i) => {
    const start = i;
    const slice = points.slice(start, start + window);
    const avg = slice.reduce((sum, s) => sum + s.value, 0) / window;
    return { date: p.date, value: Math.round(avg * 100) / 100 };
  });
}

/**
 * Calculate compound monthly growth rate from data points.
 */
export function monthlyGrowthRate(points: DataPoint[]): number {
  if (points.length < 2) return 0;
  const first = points[0].value;
  const last = points[points.length - 1].value;
  if (first === 0) return 0;
  const months = points.length - 1;
  return ((last / first) ** (1 / months) - 1) * 100;
}

/**
 * Generate forecast data points extending the trend.
 */
export function forecast(points: DataPoint[], periodsAhead = 3): DataPoint[] {
  const trend = linearRegression(points);
  const n = points.length;
  const lastDate = points.length ? new Date(points[points.length - 1].date) : new Date();

  return Array.from({ length: periodsAhead }, (_, i) => {
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + i + 1);
    const predicted = Math.max(0, Math.round(trend.slope * (n + i) + trend.intercept));
    return {
      date: futureDate.toISOString().substring(0, 7),
      value: predicted,
    };
  });
}

/**
 * Detect anomalies using z-score (values beyond 2 standard deviations).
 */
export function detectAnomalies(points: DataPoint[], threshold = 2): DataPoint[] {
  if (points.length < 3) return [];
  const values = points.map((p) => p.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
  if (std === 0) return [];
  return points.filter((p) => Math.abs((p.value - mean) / std) > threshold);
}
