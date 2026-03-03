import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandingSettings } from "@/components/admin/settings/BrandingSettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrandingPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { settings, isLoading, saveSetting } = useSiteSettings();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Globe}
        title={isAr ? "العلامة التجارية" : "Branding"}
        description={isAr ? "اسم الموقع والوصف ومعلومات الاتصال وإعدادات التسجيل" : "Site name, description, contact info & registration settings"}
      />
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <BrandingSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
      )}
    </div>
  );
}
