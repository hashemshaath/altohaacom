import { useLanguage } from "@/i18n/LanguageContext";
import { Layers } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ThemePresetsPanel } from "@/components/admin/settings/ThemePresetsPanel";
import { CoverSettings } from "@/components/admin/settings/CoverSettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoversThemesPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
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
          <ThemePresetsPanel settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          <CoverSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
        </>
      )}
    </div>
  );
}
