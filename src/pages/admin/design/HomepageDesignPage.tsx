import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Layers, ArrowRight, LayoutGrid } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { HomepageTemplateSwitcher } from "@/components/admin/settings/HomepageTemplateSwitcher";
import { BlockListManager } from "@/components/admin/settings/homepage/BlockListManager";
import { BlockLivePreview } from "@/components/admin/settings/homepage/BlockLivePreview";
import { useHomepageBlocks } from "@/hooks/useHomepageBlocks";

export default function HomepageDesignPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: blocks = [] } = useHomepageBlocks();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Home}
        title={isAr ? "الصفحة الرئيسية" : "Homepage Design"}
        description={isAr ? "تحكم شامل في بلوكات الصفحة الرئيسية — مصدر البيانات والتخطيط والتصميم" : "Full control over homepage blocks — data source, layout, and design"}
      />

      <HomepageTemplateSwitcher />

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

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <BlockListManager />
        <BlockLivePreview blocks={blocks} isAr={isAr} />
      </div>
    </div>
  );
}
