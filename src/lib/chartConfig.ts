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

/** Translate platform role keys to display labels */
const ROLE_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  admin: { en: "Admin", ar: "مدير" },
  moderator: { en: "Moderator", ar: "مشرف" },
  user: { en: "User", ar: "مستخدم" },
  judge: { en: "Judge", ar: "حَكَم" },
  chef: { en: "Chef", ar: "طاهٍ" },
  supervisor: { en: "Supervisor", ar: "مشرف" },
  viewer: { en: "Viewer", ar: "مشاهد" },
  editor: { en: "Editor", ar: "محرر" },
  manager: { en: "Manager", ar: "مدير" },
  owner: { en: "Owner", ar: "مالك" },
  contestant: { en: "Contestant", ar: "متسابق" },
  participant: { en: "Participant", ar: "مشارك" },
  sponsor: { en: "Sponsor", ar: "راعي" },
  organizer: { en: "Organizer", ar: "منظم" },
};

export function translateRole(role: string, isAr: boolean): string {
  const t = ROLE_TRANSLATIONS[role.toLowerCase()];
  return t ? (isAr ? t.ar : t.en) : role;
}

/** Translate competition/entity status keys */
const STATUS_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  active: { en: "Active", ar: "نشط" },
  inactive: { en: "Inactive", ar: "غير نشط" },
  draft: { en: "Draft", ar: "مسودة" },
  published: { en: "Published", ar: "منشور" },
  completed: { en: "Completed", ar: "مكتمل" },
  cancelled: { en: "Cancelled", ar: "ملغي" },
  pending: { en: "Pending", ar: "قيد الانتظار" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
  closed: { en: "Closed", ar: "مغلق" },
  open: { en: "Open", ar: "مفتوح" },
  upcoming: { en: "Upcoming", ar: "قادم" },
  suspended: { en: "Suspended", ar: "موقوف" },
  unknown: { en: "Unknown", ar: "غير معروف" },
};

export function translateStatus(status: string, isAr: boolean): string {
  const t = STATUS_TRANSLATIONS[status.toLowerCase()];
  return t ? (isAr ? t.ar : t.en) : status;
}

/** RTL-aware tooltip style */
export function getTooltipStyle(isAr: boolean): React.CSSProperties {
  return {
    ...TOOLTIP_STYLE,
    direction: isAr ? "rtl" : "ltr",
    textAlign: isAr ? "right" : "left",
  };
}
