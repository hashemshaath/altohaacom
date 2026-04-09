import { useEffect, useRef, useCallback } from "react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { THEME_PRESETS, FONT_OPTIONS, HEADING_FONT_OPTIONS } from "@/config/themePresets";
import { ADMIN_COLOR_STORAGE_KEY, applyAdminColorTemplate, ADMIN_COLOR_TEMPLATES } from "@/config/adminColorTemplates";

const LOCAL_THEME_KEY = "altoha_theme_preset";
const LOCAL_FONT_KEY = "altoha_body_font";
const LOCAL_HEADING_FONT_KEY = "altoha_heading_font";

const safeStorageGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * Applies theme CSS variables to the document root.
 * Priority: Seasonal Identity > Brand Identity custom colors > Theme Preset > defaults.
 * localStorage user overrides still take precedence for preset selection.
 */
export function useApplyTheme() {
  const settings = useSiteSettingsContext();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const applyTheme = useCallback(() => {
    if (typeof document === "undefined") return;

    const currentSettings = settingsRef.current;
    const globalPresetId = (currentSettings.theme as Record<string, string> | null)?.preset || "gold";
    const localPresetId = safeStorageGet(LOCAL_THEME_KEY);
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
    // IMPORTANT: Surface/text/border colors are only applied in light mode
    // because admin-configured colors are light-mode specific.
    // Primary/accent/chart colors work in both modes.
    const identity = currentSettings.brand_identity as Record<string, Record<string, string> & { seasonalIdentities?: Array<Record<string, unknown>>; activeSeasonalId?: string }> | null;
    if (identity) {
      const pc = identity.primaryColors;
      const sc = identity.secondaryColors;
      const tc = identity.typographyColors;
      const st = identity.statusColors;

      // Primary colors apply in both modes (they're brand colors)
      if (pc) {
        if (pc.primary) {
          root.style.setProperty("--primary", pc.primary);
          root.style.setProperty("--ring", pc.primary);
        }
        if (pc.accent) root.style.setProperty("--accent", pc.accent);
        if (pc.tertiary) root.style.setProperty("--chart-1", pc.tertiary);
      }

      // Surface/background colors only in light mode
      if (!isDark && sc) {
        if (sc.background) {
          root.style.setProperty("--background", sc.background);
          root.style.setProperty("--popover", sc.background);
        }
        if (sc.card) root.style.setProperty("--card", sc.card);
        if (sc.surface) root.style.setProperty("--secondary", sc.surface);
        if (sc.muted) root.style.setProperty("--muted", sc.muted);
        if (sc.border) {
          root.style.setProperty("--border", sc.border);
          root.style.setProperty("--input", sc.border);
        }
      }

      // Typography colors only in light mode
      if (!isDark && tc) {
        if (tc.heading) {
          root.style.setProperty("--foreground", tc.heading);
          root.style.setProperty("--popover-foreground", tc.heading);
        }
        if (tc.body) {
          root.style.setProperty("--card-foreground", tc.body);
          root.style.setProperty("--secondary-foreground", tc.body);
        }
        if (tc.caption) root.style.setProperty("--muted-foreground", tc.caption);
      }

      // Status colors apply in both modes
      if (st) {
        if (st.success) root.style.setProperty("--success", st.success);
        if (st.warning) root.style.setProperty("--warning", st.warning);
        if (st.error) root.style.setProperty("--destructive", st.error);
        if (st.info) root.style.setProperty("--info", st.info);
      }

      // Seasonal identity — primary colors only (work in both modes)
      if (identity.activeSeasonalId && identity.seasonalIdentities) {
        const now = new Date();
        const seasonal = (identity.seasonalIdentities as Array<Record<string, unknown>>).find(
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

    // Apply typography fonts
    const globalTypo = (currentSettings.typography as Record<string, string> | null) || {};
    const localBodyFont = safeStorageGet(LOCAL_FONT_KEY);
    const localHeadingFont = safeStorageGet(LOCAL_HEADING_FONT_KEY);

    const bodyFontId = localBodyFont || globalTypo.bodyFont || "dm-sans";
    const headingFontId = localHeadingFont || globalTypo.headingFont || "dm-serif";

    const bodyFont = FONT_OPTIONS.find((f) => f.id === bodyFontId);
    const headingFont = HEADING_FONT_OPTIONS.find((f) => f.id === headingFontId);

    if (bodyFont) root.style.setProperty("--font-sans", bodyFont.family);
    if (headingFont) root.style.setProperty("--font-serif", headingFont.family);

    // Re-apply admin color template on top (if active)
    const adminTemplateId = safeStorageGet(ADMIN_COLOR_STORAGE_KEY);
    if (adminTemplateId && ADMIN_COLOR_TEMPLATES.find((t) => t.id === adminTemplateId)) {
      applyAdminColorTemplate(adminTemplateId);
    }
  }, []);

  // Apply on mount and when settings change
  useEffect(() => {
    applyTheme();
  }, [settings, applyTheme]);

  // Watch for dark/light class changes and re-apply
  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const observer = new MutationObserver(() => {
      // Small delay to ensure class is fully applied
      requestAnimationFrame(applyTheme);
    });

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === LOCAL_THEME_KEY ||
        e.key === LOCAL_FONT_KEY ||
        e.key === LOCAL_HEADING_FONT_KEY ||
        e.key === ADMIN_COLOR_STORAGE_KEY
      ) {
        applyTheme();
      }
    };

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("theme-change", applyTheme);
    window.addEventListener("storage", onStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener("theme-change", applyTheme);
      window.removeEventListener("storage", onStorage);
    };
  }, [applyTheme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof document === "undefined") return;
      const root = document.documentElement;
      const preset = THEME_PRESETS[0];
      Object.keys(preset.light).forEach((prop) => root.style.removeProperty(prop));
      root.style.removeProperty("--font-sans");
      root.style.removeProperty("--font-serif");
    };
  }, []);
}
