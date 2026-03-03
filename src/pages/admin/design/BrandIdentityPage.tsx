import { useLanguage } from "@/i18n/LanguageContext";
import { Sparkles, Globe, Type } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandIdentityPanel } from "@/components/admin/settings/BrandIdentityPanel";
import { BrandingSettings } from "@/components/admin/settings/BrandingSettings";
import { TypographySettings } from "@/components/admin/settings/TypographySettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrandIdentityPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { settings, isLoading, saveSetting } = useSiteSettings();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Sparkles}
        title={isAr ? "الهوية البصرية والعلامة التجارية" : "Brand Identity & Branding"}
        description={isAr ? "إدارة الشعارات والألوان والعلامة التجارية والخطوط في مكان واحد" : "Manage logos, colors, branding, and typography in one place"}
      />

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="w-full flex h-auto gap-1 bg-muted/50 p-1 rounded-2xl">
          <TabsTrigger value="identity" className="text-xs gap-1.5 flex-1 rounded-xl data-[state=active]:shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "الهوية البصرية" : "Visual Identity"}
          </TabsTrigger>
          <TabsTrigger value="branding" className="text-xs gap-1.5 flex-1 rounded-xl data-[state=active]:shadow-sm">
            <Globe className="h-3.5 w-3.5" />
            {isAr ? "العلامة التجارية" : "Branding"}
          </TabsTrigger>
          <TabsTrigger value="typography" className="text-xs gap-1.5 flex-1 rounded-xl data-[state=active]:shadow-sm">
            <Type className="h-3.5 w-3.5" />
            {isAr ? "الخطوط" : "Typography"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-4">
          <BrandIdentityPanel settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
        </TabsContent>

        <TabsContent value="branding" className="mt-4">
          <BrandingSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
        </TabsContent>

        <TabsContent value="typography" className="mt-4">
          <TypographySettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
