import { describe, it, expect } from "vitest";
import {
  linearRegression,
  movingAverage,
  monthlyGrowthRate,
  forecast,
  detectAnomalies,
  type DataPoint,
} from "@/lib/trendPrediction";

const sampleData: DataPoint[] = [
  { date: "2025-01", value: 10 },
  { date: "2025-02", value: 15 },
  { date: "2025-03", value: 20 },
  { date: "2025-04", value: 25 },
  { date: "2025-05", value: 30 },
];

describe("linearRegression", () => {
  it("detects upward trend", () => {
    const result = linearRegression(sampleData);
    expect(result.direction).toBe("up");
    expect(result.slope).toBe(5);
    expect(result.r2).toBeCloseTo(1, 5);
  });

  it("handles empty/single data", () => {
    expect(linearRegression([]).direction).toBe("stable");
    expect(linearRegression([{ date: "2025-01", value: 5 }]).direction).toBe("stable");
  });

  it("predicts next value correctly for linear data", () => {
    const result = linearRegression(sampleData);
    expect(result.predictedNext).toBe(35);
  });
});

describe("movingAverage", () => {
  it("calculates 3-period moving average", () => {
    const ma = movingAverage(sampleData, 3);
    expect(ma).toHaveLength(3);
    expect(ma[0].value).toBeCloseTo(15, 1);
    expect(ma[1].value).toBeCloseTo(20, 1);
  });

  it("returns original if window > data length", () => {
    const ma = movingAverage(sampleData.slice(0, 2), 3);
    expect(ma).toHaveLength(2);
  });
});

describe("monthlyGrowthRate", () => {
  it("calculates positive growth", () => {
    const rate = monthlyGrowthRate(sampleData);
    expect(rate).toBeGreaterThan(0);
  });

  it("returns 0 for insufficient data", () => {
    expect(monthlyGrowthRate([])).toBe(0);
    expect(monthlyGrowthRate([{ date: "2025-01", value: 10 }])).toBe(0);
  });
});

describe("forecast", () => {
  it("generates correct number of forecast points", () => {
    const fc = forecast(sampleData, 3);
    expect(fc).toHaveLength(3);
    fc.forEach((p) => {
      expect(p.value).toBeGreaterThan(0);
      expect(p.date).toMatch(/^\d{4}-\d{2}$/);
    });
  });
});

describe("detectAnomalies", () => {
  it("finds no anomalies in linear data", () => {
    expect(detectAnomalies(sampleData)).toHaveLength(0);
  });

  it("detects outliers", () => {
    const dataWithOutlier: DataPoint[] = [
      ...sampleData,
      { date: "2025-06", value: 200 },
    ];
    const anomalies = detectAnomalies(dataWithOutlier);
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].value).toBe(200);
  });
});
