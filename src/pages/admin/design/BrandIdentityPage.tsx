import { useIsAr } from "@/hooks/useIsAr";
import { Sparkles, Globe, Type } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandIdentityPanel } from "@/components/admin/settings/BrandIdentityPanel";
import { BrandingSettings } from "@/components/admin/settings/BrandingSettings";
import { TypographySettings } from "@/components/admin/settings/TypographySettings";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export default function BrandIdentityPage() {
  const isAr = useIsAr();
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
