import { memo } from "react";
import { useApplyTheme } from "@/hooks/useApplyTheme";

/**
 * Invisible component that applies the active theme preset CSS variables.
 * Must be rendered inside SiteSettingsProvider.
 */
export const ThemeApplicator = memo(function ThemeApplicator() {
  useApplyTheme();
  return null;
});
