import { useIsAr } from "@/hooks/useIsAr";
import { Layers } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ThemePresetsPanel } from "@/components/admin/settings/ThemePresetsPanel";
import { CoverSettings } from "@/components/admin/settings/CoverSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetErrorBoundary } from "@/components/WidgetErrorBoundary";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export default function CoversThemesPage() {
  const isAr = useIsAr();
  const { settings, isLoading, saveSetting } = useSiteSettings();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Layers}
        title={isAr ? "الأغلفة والمظهر" : "Covers & Themes"}
        description={isAr ? "قوالب الألوان وإعدادات التدرج والأغلفة لكل صفحة" : "Theme presets, gradient settings & per-page cover configuration"}
      />
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <>
          <WidgetErrorBoundary name="theme-presets">
            <ThemePresetsPanel settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary name="cover-settings">
            <CoverSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </WidgetErrorBoundary>
        </>
      )}
    </div>
  );
}
