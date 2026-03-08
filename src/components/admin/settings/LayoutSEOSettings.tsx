import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Save, Layout, Search } from "lucide-react";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

export const LayoutSEOSettings = memo(function LayoutSEOSettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const layoutCfg = settings.layout || {};
  const seoCfg = settings.seo || {};

  const [layout, setLayout] = useState(layoutCfg);
  const [seo, setSeo] = useState(seoCfg);

  useEffect(() => { setLayout(layoutCfg); }, [JSON.stringify(layoutCfg)]);
  useEffect(() => { setSeo(seoCfg); }, [JSON.stringify(seoCfg)]);

  return (
    <div className="space-y-6">
      {/* Layout */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layout className="h-4.5 w-4.5 text-primary" />
            {isAr ? "إعدادات التخطيط" : "Layout Settings"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "التحكم في عرض الحاوية والتباعد والرسوم المتحركة" : "Control container width, spacing, and animations"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "أقصى عرض (px)" : "Max Width (px)"}</Label>
              <Input type="number" value={layout.maxWidth || 1200} onChange={e => setLayout({ ...layout, maxWidth: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "تباعد الحاوية" : "Container Padding"}</Label>
              <Input value={layout.containerPadding || "0.75rem"} onChange={e => setLayout({ ...layout, containerPadding: e.target.value })} placeholder="0.75rem" />
            </div>
          </div>
          {[
            { key: "enableAnimations", en: "Enable Animations", ar: "تمكين الرسوم المتحركة", descEn: "Scroll reveal and hover animations", descAr: "تأثيرات التمرير والتحويم" },
            { key: "showBreadcrumbs", en: "Show Breadcrumbs", ar: "عرض مسار التنقل", descEn: "Display breadcrumb navigation", descAr: "عرض مسار التنقل في الصفحات" },
            { key: "compactMode", en: "Compact Mode", ar: "الوضع المضغوط", descEn: "Reduce spacing for denser UI", descAr: "تقليل التباعد لواجهة أكثر كثافة" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-border/40 p-3">
              <div>
                <p className="text-sm font-medium">{isAr ? item.ar : item.en}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
              </div>
              <Switch checked={layout[item.key] ?? false} onCheckedChange={v => setLayout({ ...layout, [item.key]: v })} />
            </div>
          ))}
          <Button size="sm" className="gap-1.5 mt-2" onClick={() => onSave("layout", layout, "layout")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ التخطيط" : "Save Layout"}
          </Button>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4.5 w-4.5 text-primary" />
            {isAr ? "تحسين محركات البحث (SEO)" : "SEO Settings"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "إعدادات العنوان والوصف الافتراضي والبيانات الوصفية" : "Default title, description, and metadata for search engines"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "العنوان الافتراضي (إنجليزي)" : "Default Title (English)"}</Label>
              <Input value={seo.defaultTitle || ""} onChange={e => setSeo({ ...seo, defaultTitle: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "العنوان الافتراضي (عربي)" : "Default Title (Arabic)"}</Label>
              <Input value={seo.defaultTitleAr || ""} onChange={e => setSeo({ ...seo, defaultTitleAr: e.target.value })} dir="rtl" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الوصف الافتراضي (إنجليزي)" : "Default Description (English)"}</Label>
              <Textarea rows={2} value={seo.defaultDescription || ""} onChange={e => setSeo({ ...seo, defaultDescription: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الوصف الافتراضي (عربي)" : "Default Description (Arabic)"}</Label>
              <Textarea rows={2} value={seo.defaultDescriptionAr || ""} onChange={e => setSeo({ ...seo, defaultDescriptionAr: e.target.value })} dir="rtl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "صورة المشاركة (OG Image)" : "OG Image URL"}</Label>
            <Input value={seo.ogImageUrl || ""} onChange={e => setSeo({ ...seo, ogImageUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
            <div>
              <p className="text-sm font-medium">{isAr ? "خريطة الموقع" : "Sitemap Enabled"}</p>
              <p className="text-[11px] text-muted-foreground">{isAr ? "تمكين خريطة الموقع XML" : "Enable XML sitemap generation"}</p>
            </div>
            <Switch checked={seo.sitemapEnabled ?? true} onCheckedChange={v => setSeo({ ...seo, sitemapEnabled: v })} />
          </div>
          <Button size="sm" className="gap-1.5 mt-2" onClick={() => onSave("seo", seo, "seo")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ SEO" : "Save SEO"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
