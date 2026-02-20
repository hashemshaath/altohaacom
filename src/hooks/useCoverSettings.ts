import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

export type CoverMode = "full" | "medium" | "small" | "none";

export interface CoverConfig {
  /** Global defaults */
  defaultHeight: number;        // px, default 340
  gradientColor: string;        // HSL string e.g. "25 30% 8%"
  gradientIntensity: number;    // 0-100, default 60
  /** Per-page overrides keyed by page slug */
  pages: Record<string, { mode: CoverMode }>;
}

const DEFAULT_CONFIG: CoverConfig = {
  defaultHeight: 340,
  gradientColor: "",            // empty = use --background
  gradientIntensity: 60,
  pages: {},
};

const HEIGHT_MAP: Record<CoverMode, number | null> = {
  full: 520,
  medium: 340,
  small: 200,
  none: null,
};

export function useCoverSettings(pageSlug?: string) {
  const settings = useSiteSettingsContext();
  const raw = settings.cover || {};
  const config: CoverConfig = { ...DEFAULT_CONFIG, ...raw };

  const pageMode = pageSlug ? config.pages[pageSlug]?.mode : undefined;
  const mode: CoverMode = pageMode || "medium";
  const height = HEIGHT_MAP[mode];

  // Build gradient CSS using the configured color or fallback to --background
  const colorBase = config.gradientColor || "var(--background)";
  const intensity = Math.min(100, Math.max(0, config.gradientIntensity ?? 60));
  const alpha = intensity / 100;

  // Multi-layer gradient styles for cover images
  const gradientOverlay = mode === "none" ? "" : [
    `linear-gradient(to top, hsl(${colorBase}) ${Math.round(alpha * 80)}%, transparent)`,
    `linear-gradient(to right, hsl(${colorBase} / ${(alpha * 0.5).toFixed(2)}), transparent, hsl(${colorBase} / ${(alpha * 0.5).toFixed(2)}))`,
  ].join(", ");

  return {
    config,
    mode,
    height,
    gradientOverlay,
    intensity,
    isVisible: mode !== "none",
  };
}
