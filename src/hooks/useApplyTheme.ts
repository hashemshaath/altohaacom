import { useEffect } from "react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { THEME_PRESETS, FONT_OPTIONS, HEADING_FONT_OPTIONS } from "@/config/themePresets";

const LOCAL_THEME_KEY = "altoha_theme_preset";
const LOCAL_FONT_KEY = "altoha_body_font";
const LOCAL_HEADING_FONT_KEY = "altoha_heading_font";

/**
 * Applies theme CSS variables to the document root.
 * Priority: Brand Identity custom colors > Theme Preset > defaults.
 * localStorage user overrides still take precedence for preset selection.
 */
export function useApplyTheme() {
  const settings = useSiteSettingsContext();

  const applyTheme = () => {
    const globalPresetId = (settings.theme as any)?.preset || "gold";
    const localPresetId = localStorage.getItem(LOCAL_THEME_KEY);
    const activePresetId = localPresetId || globalPresetId;

    const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
    if (!preset) return;

    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const vars = isDark ? preset.dark : preset.light;

    // Apply base preset colors
    Object.entries(vars).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });

    // Override with Brand Identity custom colors if saved
    const identity = settings.brand_identity as any;
    if (identity) {
      const pc = identity.primaryColors;
      const sc = identity.secondaryColors;
      const tc = identity.typographyColors;
      const st = identity.statusColors;

      if (pc) {
        if (pc.primary) root.style.setProperty("--primary", pc.primary);
        if (pc.accent) root.style.setProperty("--accent", pc.accent);
        if (pc.tertiary) root.style.setProperty("--chart-1", pc.tertiary);
      }
      if (sc) {
        if (sc.background) root.style.setProperty("--background", sc.background);
        if (sc.card) root.style.setProperty("--card", sc.card);
        if (sc.surface) root.style.setProperty("--secondary", sc.surface);
        if (sc.muted) root.style.setProperty("--muted", sc.muted);
        if (sc.border) {
          root.style.setProperty("--border", sc.border);
          root.style.setProperty("--input", sc.border);
        }
      }
      if (st) {
        if (st.success) root.style.setProperty("--success", st.success);
        if (st.warning) root.style.setProperty("--warning", st.warning);
        if (st.error) root.style.setProperty("--destructive", st.error);
        if (st.info) root.style.setProperty("--info", st.info);
      }

      // Check for active seasonal identity
      if (identity.activeSeasonalId && identity.seasonalIdentities) {
        const now = new Date();
        const seasonal = (identity.seasonalIdentities as any[]).find(
          (s) => s.id === identity.activeSeasonalId
        );
        if (seasonal) {
          const start = seasonal.startDate ? new Date(seasonal.startDate) : null;
          const end = seasonal.endDate ? new Date(seasonal.endDate) : null;
          const inRange = (!start || now >= start) && (!end || now <= end);
          if (inRange && seasonal.colors?.length >= 3) {
            root.style.setProperty("--primary", seasonal.colors[0]);
            root.style.setProperty("--accent", seasonal.colors[1]);
            root.style.setProperty("--chart-1", seasonal.colors[2]);
          }
        }
      }
    }

    // Apply typography
    const globalTypo = (settings.typography as any) || {};
    const localBodyFont = localStorage.getItem(LOCAL_FONT_KEY);
    const localHeadingFont = localStorage.getItem(LOCAL_HEADING_FONT_KEY);

    const bodyFontId = localBodyFont || globalTypo.bodyFont || "dm-sans";
    const headingFontId = localHeadingFont || globalTypo.headingFont || "dm-serif";

    const bodyFont = FONT_OPTIONS.find((f) => f.id === bodyFontId);
    const headingFont = HEADING_FONT_OPTIONS.find((f) => f.id === headingFontId);

    if (bodyFont) root.style.setProperty("--font-sans", bodyFont.family);
    if (headingFont) root.style.setProperty("--font-serif", headingFont.family);
  };

  useEffect(() => {
    applyTheme();
    return () => {
      const root = document.documentElement;
      const preset = THEME_PRESETS[0];
      Object.keys(preset.light).forEach((prop) => root.style.removeProperty(prop));
      root.style.removeProperty("--font-sans");
      root.style.removeProperty("--font-serif");
    };
  }, [settings]);

  useEffect(() => {
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    window.addEventListener("theme-change", applyTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener("theme-change", applyTheme);
    };
  }, [settings]);
}
