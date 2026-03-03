import { useLanguage } from "@/i18n/LanguageContext";
import { Type } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { TypographySettings } from "@/components/admin/settings/TypographySettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function TypographyPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { settings, isLoading, saveSetting } = useSiteSettings();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Type}
        title={isAr ? "الخطوط والطباعة" : "Typography"}
        description={isAr ? "اختيار خطوط النص والعناوين لجميع صفحات المنصة" : "Choose body and heading fonts for the entire platform"}
      />
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <TypographySettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
      )}
    </div>
  );
}
