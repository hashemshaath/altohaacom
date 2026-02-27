import { useApplyTheme } from "@/hooks/useApplyTheme";

/**
 * Invisible component that applies the active theme preset CSS variables.
 * Must be rendered inside SiteSettingsProvider.
 */
export function ThemeApplicator() {
  useApplyTheme();
  return null;
}
