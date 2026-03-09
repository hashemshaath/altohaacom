/**
 * Shared chart configuration for all Recharts components.
 * Ensures consistent styling, RTL support, and proper theming across all admin analytics.
 */

/** Standard chart color palette using design tokens */
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

/** Tooltip content style — consistent across all charts */
export const TOOLTIP_STYLE: React.CSSProperties = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  color: "hsl(var(--card-foreground))",
  boxShadow: "var(--shadow-md)",
  padding: "8px 12px",
};

/** Axis tick props — readable, themed */
export const AXIS_TICK = {
  fontSize: 11,
  fill: "hsl(var(--muted-foreground))",
  fontFamily: "inherit",
};

/** X-Axis default props */
export const X_AXIS_PROPS = {
  tick: AXIS_TICK,
  axisLine: { stroke: "hsl(var(--border))" },
  tickLine: false,
  dy: 8,
};

/** Y-Axis default props */
export const Y_AXIS_PROPS = {
  tick: AXIS_TICK,
  axisLine: false,
  tickLine: false,
  allowDecimals: false,
  dx: -4,
  width: 40,
};

/** CartesianGrid props — subtle dotted lines */
export const GRID_PROPS = {
  strokeDasharray: "3 3",
  stroke: "hsl(var(--border))",
  strokeOpacity: 0.6,
  vertical: false,
};

/** Legend wrapper style */
export const LEGEND_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  paddingTop: 8,
};

/** Bar radius for rounded tops */
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

/** Horizontal bar radius */
export const H_BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

/** Standard chart heights */
export const CHART_HEIGHT = {
  sm: 200,
  md: 280,
  lg: 350,
  xl: 400,
} as const;

/** No data placeholder text */
export function getNoDataText(isAr: boolean): string {
  return isAr ? "لا توجد بيانات متاحة" : "No data available";
}
