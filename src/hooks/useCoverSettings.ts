import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

export type CoverMode = "full" | "medium" | "small" | "none";
export type GradientDirection = "to-top" | "to-bottom" | "to-left" | "to-right" | "radial" | "diagonal";

export interface CoverConfig {
  /** Global defaults */
  defaultHeight: number;
  gradientColor: string;        // HSL string e.g. "25 30% 8%" or hex "#1a1a1a"
  gradientIntensity: number;    // 0-100
  gradientDirection: GradientDirection;
  gradientOpacityStart: number; // 0-100, opacity at gradient start
  gradientOpacityEnd: number;   // 0-100, opacity at gradient end
  /** Per-page overrides keyed by page slug */
  pages: Record<string, { mode: CoverMode }>;
}

const DEFAULT_CONFIG: CoverConfig = {
  defaultHeight: 340,
  gradientColor: "",
  gradientIntensity: 60,
  gradientDirection: "to-top",
  gradientOpacityStart: 90,
  gradientOpacityEnd: 0,
  pages: {},
};

export const HEIGHT_MAP: Record<CoverMode, number | null> = {
  full: 520,
  medium: 340,
  small: 200,
  none: null,
};

/** Popular cover dimension templates used across global websites */
export const COVER_TEMPLATES = [
  { id: "hero-16-9", en: "Hero 16:9", ar: "بانر رئيسي 16:9", width: 1920, height: 1080, ratio: "16:9" },
  { id: "hero-21-9", en: "Ultra-wide 21:9", ar: "عريض جداً 21:9", width: 2560, height: 1080, ratio: "21:9" },
  { id: "facebook-cover", en: "Facebook Cover", ar: "غلاف فيسبوك", width: 1640, height: 624, ratio: "2.63:1" },
  { id: "twitter-header", en: "X (Twitter) Header", ar: "غلاف إكس (تويتر)", width: 1500, height: 500, ratio: "3:1" },
  { id: "linkedin-banner", en: "LinkedIn Banner", ar: "بانر لينكدإن", width: 1584, height: 396, ratio: "4:1" },
  { id: "youtube-banner", en: "YouTube Banner", ar: "بانر يوتيوب", width: 2560, height: 1440, ratio: "16:9" },
  { id: "og-image", en: "OG / Share Image", ar: "صورة المشاركة", width: 1200, height: 630, ratio: "1.91:1" },
  { id: "compact-strip", en: "Compact Strip", ar: "شريط مضغوط", width: 1920, height: 400, ratio: "4.8:1" },
];

function parseColor(color: string): string {
  if (!color) return "var(--background)";
  // If hex, convert display but keep as-is for CSS
  if (color.startsWith("#")) return color;
  // Assume HSL values
  return color;
}

function buildGradientCSS(
  color: string,
  direction: GradientDirection,
  opacityStart: number,
  opacityEnd: number,
  intensity: number,
): string {
  const c = parseColor(color);
  const isHex = c.startsWith("#");
  const alphaStart = ((opacityStart / 100) * (intensity / 100)).toFixed(2);
  const alphaEnd = ((opacityEnd / 100) * (intensity / 100)).toFixed(2);

  const colorStart = isHex ? hexToRgba(c, +alphaStart) : `hsl(${c} / ${alphaStart})`;
  const colorEnd = isHex ? hexToRgba(c, +alphaEnd) : `hsl(${c} / ${alphaEnd})`;
  const colorMid = isHex ? hexToRgba(c, (+alphaStart + +alphaEnd) / 2) : `hsl(${c} / ${((+alphaStart + +alphaEnd) / 2).toFixed(2)})`;

  const cssDir: Record<GradientDirection, string> = {
    "to-top": "to top",
    "to-bottom": "to bottom",
    "to-left": "to left",
    "to-right": "to right",
    "diagonal": "135deg",
    "radial": "radial",
  };

  if (direction === "radial") {
    return `radial-gradient(ellipse at center, ${colorEnd} 0%, ${colorMid} 50%, ${colorStart} 100%)`;
  }

  return `linear-gradient(${cssDir[direction]}, ${colorStart} 0%, ${colorEnd} 100%)`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useCoverSettings(pageSlug?: string) {
  const settings = useSiteSettingsContext();
  const raw = settings.cover || {};
  const config: CoverConfig = { ...DEFAULT_CONFIG, ...raw };

  const pageMode = pageSlug ? config.pages[pageSlug]?.mode : undefined;
  const mode: CoverMode = pageMode || "medium";
  const height = HEIGHT_MAP[mode];

  const intensity = Math.min(100, Math.max(0, config.gradientIntensity ?? 60));
  const direction = config.gradientDirection || "to-top";
  const opacityStart = config.gradientOpacityStart ?? 90;
  const opacityEnd = config.gradientOpacityEnd ?? 0;
  const colorBase = config.gradientColor || "var(--background)";

  const gradientOverlay = mode === "none"
    ? ""
    : buildGradientCSS(colorBase, direction, opacityStart, opacityEnd, intensity);

  return {
    config,
    mode,
    height,
    gradientOverlay,
    intensity,
    isVisible: mode !== "none",
  };
}
