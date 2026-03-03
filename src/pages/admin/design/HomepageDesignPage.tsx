import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Layers, ArrowRight, LayoutGrid } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { HomepageSectionsManager } from "@/components/admin/settings/HomepageSectionsManager";
import { HomepageTemplateSwitcher } from "@/components/admin/settings/HomepageTemplateSwitcher";
import { HomepageLivePreview } from "@/components/admin/settings/homepage/HomepageLivePreview";
import { SectionPresets } from "@/components/admin/settings/homepage/SectionPresets";
import { useHomepageSections, useUpdateHomepageSection } from "@/hooks/useHomepageSections";

export default function HomepageDesignPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: homepageSections = [] } = useHomepageSections();
  const updateSection = useUpdateHomepageSection();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Home}
        title={isAr ? "الصفحة الرئيسية" : "Homepage Design"}
        description={isAr ? "إدارة أقسام الصفحة الرئيسية والقوالب والشرائح" : "Manage homepage sections, templates & hero slides"}
      />

      <HomepageTemplateSwitcher />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{isAr ? "شرائح البطل" : "Hero Slides"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "قوالب احترافية" : "Professional templates"}</p>
              </div>
            </div>
            <Button size="sm" variant="default" className="gap-1.5 shrink-0" asChild>
              <Link to="/admin/hero-slides">
                {isAr ? "إدارة" : "Manage"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{isAr ? "أقسام الصفحة الرئيسية" : "Homepage Sections"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "ترتيب وإظهار الأقسام" : "Order, visibility & design"}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 shrink-0" asChild>
              <Link to="/admin/homepage-sections">
                {isAr ? "إدارة" : "Manage"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <HomepageSectionsManager />
        <div className="space-y-4">
          <HomepageLivePreview sections={homepageSections} isAr={isAr} />
          <SectionPresets
            isAr={isAr}
            isPending={updateSection.isPending}
            onApply={(config) => {
              homepageSections.filter((s: any) => s.is_visible).forEach((s: any) => {
                updateSection.mutate({ id: s.id, ...config });
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
