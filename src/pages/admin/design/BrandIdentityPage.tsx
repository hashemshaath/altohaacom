import { useLanguage } from "@/i18n/LanguageContext";
import { Sparkles } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandIdentityPanel } from "@/components/admin/settings/BrandIdentityPanel";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrandIdentityPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { settings, isLoading, saveSetting } = useSiteSettings();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Sparkles}
        title={isAr ? "الهوية البصرية" : "Brand Identity"}
        description={isAr ? "إدارة الشعارات والألوان والتباين والهويات الموسمية" : "Manage logos, colors, contrast, and seasonal identities"}
      />
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <BrandIdentityPanel settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
      )}
    </div>
  );
}
