import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home, Layers, ArrowRight, Megaphone, Eye, EyeOff,
  BarChart3, AlertTriangle, CheckCircle, Settings2, Sparkles,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { HomepageTemplateSwitcher } from "@/components/admin/settings/HomepageTemplateSwitcher";
import { HomepageSectionsManager } from "@/components/admin/settings/HomepageSectionsManager";
import { HomepageLivePreview } from "@/components/admin/settings/homepage/HomepageLivePreview";
import { useHomepageSections } from "@/hooks/useHomepageSections";

export default function HomepageDesignPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: sections = [] } = useHomepageSections();

  // Section health stats
  const visibleCount = sections.filter(s => s.is_visible).length;
  const hiddenCount = sections.length - visibleCount;
  const adSections = sections.filter(s => s.section_key?.startsWith("ad_banner"));
  const activeAdSections = adSections.filter(s => s.is_visible).length;
  const hasMissingComponents = sections.some(s => s.is_visible && !s.component_name && !s.section_key?.startsWith("ad_banner"));

  // Active campaigns count
  const { data: activeCampaigns = 0 } = useQuery({
    queryKey: ["homepage-active-campaigns"],
    queryFn: async () => {
      const { count } = await supabase.from("ad_campaigns").select("id", { count: "exact", head: true }).eq("status", "active");
      return count || 0;
    },
    staleTime: 60000,
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        icon={Home}
        title={isAr ? "الصفحة الرئيسية" : "Homepage Design"}
        description={isAr ? "تحكم شامل في أقسام الصفحة الرئيسية — المصدر والترتيب والظهور والتصميم" : "Full control over homepage sections — source, order, visibility, and design"}
      />

      {/* Health overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Eye, label: isAr ? "أقسام مرئية" : "Visible", value: visibleCount, color: "text-chart-2" },
          { icon: EyeOff, label: isAr ? "مخفية" : "Hidden", value: hiddenCount, color: "text-muted-foreground" },
          { icon: Megaphone, label: isAr ? "مواقع إعلانية" : "Ad Slots", value: `${activeAdSections}/${adSections.length}`, color: "text-chart-4" },
          { icon: BarChart3, label: isAr ? "حملات نشطة" : "Active Campaigns", value: activeCampaigns, color: "text-primary" },
        ].map((stat, i) => (
          <Card key={i} className="rounded-2xl border-border/40">
            <CardContent className="flex items-center gap-2.5 p-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-muted shrink-0 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Health warnings */}
      {hasMissingComponents && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <p className="text-xs text-warning">
            {isAr ? "بعض الأقسام المرئية لا تملك مكوّن مخصص وتعرض 'قريباً'" : "Some visible sections have no dedicated component and show 'Coming soon'"}
          </p>
        </div>
      )}

      <HomepageTemplateSwitcher />

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {/* Hero Slides */}
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">{isAr ? "شرائح البطل" : "Hero Slides"}</p>
            <p className="text-[12px] text-muted-foreground">{isAr ? "قوالب احترافية" : "Professional templates"}</p>
          </div>
          <Button size="sm" variant="default" className="h-7 text-xs gap-1 rounded-xl ms-2" asChild>
            <Link to="/admin/hero-slides">
              {isAr ? "إدارة" : "Manage"} <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {/* Advertising */}
        <div className="flex items-center gap-2 rounded-xl border border-chart-4/20 bg-chart-4/5 px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-4/10">
            <Megaphone className="h-3.5 w-3.5 text-chart-4" />
          </div>
          <div>
            <p className="text-xs font-semibold">{isAr ? "الإعلانات" : "Advertising"}</p>
            <p className="text-[12px] text-muted-foreground">
              {activeCampaigns > 0
                ? `${activeCampaigns} ${isAr ? "حملة نشطة" : "active campaigns"}`
                : (isAr ? "لا توجد حملات نشطة" : "No active campaigns")}
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 rounded-xl ms-2" asChild>
            <Link to="/admin/advertising">
              {isAr ? "إدارة" : "Manage"} <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {/* Design System */}
        <Button size="sm" variant="ghost" className="h-auto py-2 text-xs gap-1 rounded-xl border border-border/40" asChild>
          <Link to="/admin/design/brand-identity">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "هوية العلامة" : "Brand Identity"}
          </Link>
        </Button>

        {/* Auth Slides */}
        <Button size="sm" variant="ghost" className="h-auto py-2 text-xs gap-1 rounded-xl border border-border/40" asChild>
          <Link to="/admin/auth-slides">
            <Layers className="h-3.5 w-3.5" />
            {isAr ? "شرائح تسجيل الدخول" : "Auth Slides"}
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
