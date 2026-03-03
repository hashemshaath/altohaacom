import { useLanguage } from "@/i18n/LanguageContext";
import { PanelTop } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HeaderFooterSettings } from "@/components/admin/settings/HeaderFooterSettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function HeaderFooterPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { settings, isLoading, saveSetting } = useSiteSettings();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={PanelTop}
        title={isAr ? "الرأس والتذييل" : "Header & Footer"}
        description={isAr ? "التحكم في مكونات الرأس والتذييل وروابط التواصل الاجتماعي" : "Control header & footer components and social media links"}
      />
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <HeaderFooterSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
      )}
    </div>
  );
}
