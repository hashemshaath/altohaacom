import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Layers, ArrowRight } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { HomepageTemplateSwitcher } from "@/components/admin/settings/HomepageTemplateSwitcher";
import { HomepageSectionsManager } from "@/components/admin/settings/HomepageSectionsManager";
import { HomepageLivePreview } from "@/components/admin/settings/homepage/HomepageLivePreview";
import { useHomepageSections } from "@/hooks/useHomepageSections";

export default function HomepageDesignPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: sections = [] } = useHomepageSections();

  return (
    <div className="space-y-4">
      <AdminPageHeader
        icon={Home}
        title={isAr ? "الصفحة الرئيسية" : "Homepage Design"}
        description={isAr ? "تحكم شامل في أقسام الصفحة الرئيسية — المصدر والترتيب والظهور والتصميم" : "Full control over homepage sections — source, order, visibility, and design"}
      />

      <HomepageTemplateSwitcher />

      {/* Hero Slides link */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">{isAr ? "شرائح البطل" : "Hero Slides"}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "قوالب احترافية" : "Professional templates"}</p>
          </div>
        </div>
        <Button size="sm" variant="default" className="h-7 text-xs gap-1" asChild>
          <Link to="/admin/hero-slides">
            {isAr ? "إدارة" : "Manage"}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_260px]">
        <HomepageSectionsManager />
        <div className="hidden xl:block sticky top-4">
          <HomepageLivePreview sections={sections} isAr={isAr} />
        </div>
      </div>
    </div>
  );
}
