import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export type TimeRange = "1h" | "24h" | "7d" | "30d" | "90d";

export const EXTRA_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))",
  "hsl(var(--accent))", "hsl(var(--destructive))",
];

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function getDelta(current: number, previous: number): { value: number; direction: "up" | "down" | "flat" } {
  if (previous === 0) return { value: 0, direction: "flat" };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(pct), direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

export interface EcomMetrics {
  addToCartEvents: number;
  beginCheckoutEvents: number;
  purchaseEvents: number;
  productViews: number;
  listViews: number;
  removeFromCartEvents: number;
  activeCarts: number;
  recoveredCarts: number;
  abandonedValue: number;
  recoveryRate: number;
  totalRevenue: number;
  avgOrderValue: number;
  completedOrders: number;
  totalOrders: number;
  cartToCheckoutRate: number;
  checkoutToPayRate: number;
  overallConversion: number;
  funnel: { stage: string; stageAr: string; value: number }[];
  cartStatus: { name: string; nameAr: string; value: number }[];
  revenueData: { date: string; revenue: number }[];
  membershipEvents: number;
  competitionRegs: number;
  bookingEvents: number;
}
