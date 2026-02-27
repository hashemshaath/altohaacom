import { useEffect } from "react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { THEME_PRESETS, FONT_OPTIONS, HEADING_FONT_OPTIONS } from "@/config/themePresets";

const LOCAL_THEME_KEY = "altoha_theme_preset";
const LOCAL_FONT_KEY = "altoha_body_font";
const LOCAL_HEADING_FONT_KEY = "altoha_heading_font";

/**
 * Applies theme CSS variables to the document root.
 * Priority: localStorage user override > DB global setting > default (gold).
 */
export function useApplyTheme() {
  const settings = useSiteSettingsContext();

  useEffect(() => {
    const globalPresetId = (settings.theme as any)?.preset || "gold";
    const localPresetId = localStorage.getItem(LOCAL_THEME_KEY);
    const activePresetId = localPresetId || globalPresetId;

    const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
    if (!preset) return;

    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const vars = isDark ? preset.dark : preset.light;

    Object.entries(vars).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });

    // Apply typography
    const globalTypo = (settings.typography as any) || {};
    const localBodyFont = localStorage.getItem(LOCAL_FONT_KEY);
    const localHeadingFont = localStorage.getItem(LOCAL_HEADING_FONT_KEY);

    const bodyFontId = localBodyFont || globalTypo.bodyFont || "dm-sans";
    const headingFontId = localHeadingFont || globalTypo.headingFont || "dm-serif";

    const bodyFont = FONT_OPTIONS.find((f) => f.id === bodyFontId);
    const headingFont = HEADING_FONT_OPTIONS.find((f) => f.id === headingFontId);

    if (bodyFont) {
      root.style.setProperty("--font-sans", bodyFont.family);
    }
    if (headingFont) {
      root.style.setProperty("--font-serif", headingFont.family);
    }

    // Cleanup on unmount
    return () => {
      Object.keys(vars).forEach((prop) => {
        root.style.removeProperty(prop);
      });
      root.style.removeProperty("--font-sans");
      root.style.removeProperty("--font-serif");
    };
  }, [settings]);

  // Re-apply when dark mode toggles or user changes theme via personalization widget
  useEffect(() => {
    const applyCurrentTheme = () => {
      const globalPresetId = (settings.theme as any)?.preset || "gold";
      const localPresetId = localStorage.getItem(LOCAL_THEME_KEY);
      const activePresetId = localPresetId || globalPresetId;

      const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
      if (!preset) return;

      const root = document.documentElement;
      const isDark = root.classList.contains("dark");
      const vars = isDark ? preset.dark : preset.light;

      Object.entries(vars).forEach(([prop, val]) => {
        root.style.setProperty(prop, val);
      });

      // Re-apply fonts
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

    const observer = new MutationObserver(applyCurrentTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Listen for theme-change events from personalization widget
    window.addEventListener("theme-change", applyCurrentTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("theme-change", applyCurrentTheme);
    };
  }, [settings]);
}
