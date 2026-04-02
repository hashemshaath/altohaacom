import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search, Globe, Map, Save, Loader2, Eye, Tag,
} from "lucide-react";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

const CHAR_LIMITS = { title: 60, description: 160 };

function CharCount({ value, max }: { value: string; max: number }) {
  const len = (value || "").length;
  const over = len > max;
  return (
    <span className={`text-[10px] tabular-nums ${over ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
      {len}/{max}
    </span>
  );
}

export const SEOAnalyticsSettings = memo(function SEOAnalyticsSettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const existing = settings.seo_analytics || {};

  const [seo, setSeo] = useState({
    siteNameAr: "الطهاة",
    siteNameEn: "AlToha",
    defaultTitleAr: "",
    defaultTitleEn: "",
    defaultDescriptionAr: "",
    defaultDescriptionEn: "",
    defaultKeywordsAr: "",
    defaultKeywordsEn: "",
    defaultOgImageUrl: "",
  });

  const [sitemap, setSitemap] = useState({
    autoUpdate: true,
    includeChefProfiles: true,
    includeCompetitions: true,
    includeExhibitions: true,
    includeAcademies: true,
    includeAssociations: true,
    includeBlogArticles: true,
    includeEvents: true,
  });

  useEffect(() => {
    if (!existing || Object.keys(existing).length === 0) return;
    if (existing.seo) setSeo(prev => ({ ...prev, ...existing.seo }));
    if (existing.sitemap) setSitemap(prev => ({ ...prev, ...existing.sitemap }));
  }, [JSON.stringify(existing)]);

  const handleSave = () => {
    // Preserve any existing analytics data for backward compatibility
    onSave("seo_analytics", { analytics: existing.analytics || {}, seo, sitemap }, "seo");
  };

  return (
    <div className="space-y-6">
      {/* ── DEFAULT SEO ── */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" />
            {isAr ? "إعدادات SEO الافتراضية" : "Default SEO Settings"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "القيم الافتراضية المستخدمة عند عدم تحديد بيانات وصفية مخصصة للصفحة" : "Fallback values when pages don't specify custom meta data"}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                {isAr ? "اسم الموقع (عربي)" : "Site Name (Arabic)"}
              </Label>
              <Input value={seo.siteNameAr} onChange={e => setSeo(p => ({ ...p, siteNameAr: e.target.value }))} dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                {isAr ? "اسم الموقع (إنجليزي)" : "Site Name (English)"}
              </Label>
              <Input value={seo.siteNameEn} onChange={e => setSeo(p => ({ ...p, siteNameEn: e.target.value }))} />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{isAr ? "عنوان Meta الافتراضي (عربي)" : "Default Meta Title (AR)"}</Label>
                <CharCount value={seo.defaultTitleAr} max={CHAR_LIMITS.title} />
              </div>
              <Textarea value={seo.defaultTitleAr} onChange={e => setSeo(p => ({ ...p, defaultTitleAr: e.target.value }))} placeholder="الطهاة | مجتمع الطهاة العالمي" rows={2} dir="rtl" maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{isAr ? "عنوان Meta الافتراضي (إنجليزي)" : "Default Meta Title (EN)"}</Label>
                <CharCount value={seo.defaultTitleEn} max={CHAR_LIMITS.title} />
              </div>
              <Textarea value={seo.defaultTitleEn} onChange={e => setSeo(p => ({ ...p, defaultTitleEn: e.target.value }))} placeholder="AlToha | Global Chef Community" rows={2} maxLength={80} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{isAr ? "وصف Meta الافتراضي (عربي)" : "Default Meta Description (AR)"}</Label>
                <CharCount value={seo.defaultDescriptionAr} max={CHAR_LIMITS.description} />
              </div>
              <Textarea value={seo.defaultDescriptionAr} onChange={e => setSeo(p => ({ ...p, defaultDescriptionAr: e.target.value }))} placeholder="منصة الطهاة العالمية" rows={3} dir="rtl" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{isAr ? "وصف Meta الافتراضي (إنجليزي)" : "Default Meta Description (EN)"}</Label>
                <CharCount value={seo.defaultDescriptionEn} max={CHAR_LIMITS.description} />
              </div>
              <Textarea value={seo.defaultDescriptionEn} onChange={e => setSeo(p => ({ ...p, defaultDescriptionEn: e.target.value }))} placeholder="The global chef community platform." rows={3} maxLength={200} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                {isAr ? "كلمات مفتاحية (عربي)" : "Meta Keywords (AR)"}
              </Label>
              <Textarea value={seo.defaultKeywordsAr} onChange={e => setSeo(p => ({ ...p, defaultKeywordsAr: e.target.value }))} placeholder="طهاة, مجتمع الطهي, معارض الطعام" rows={2} dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                {isAr ? "كلمات مفتاحية (إنجليزي)" : "Meta Keywords (EN)"}
              </Label>
              <Textarea value={seo.defaultKeywordsEn} onChange={e => setSeo(p => ({ ...p, defaultKeywordsEn: e.target.value }))} placeholder="chefs, culinary community, food exhibitions" rows={2} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              {isAr ? "صورة Open Graph الافتراضية" : "Default OG Image URL"}
            </Label>
            <Input value={seo.defaultOgImageUrl} onChange={e => setSeo(p => ({ ...p, defaultOgImageUrl: e.target.value }))} placeholder="https://altoha.com/og-image.png" />
            <p className="text-[10px] text-muted-foreground">
              {isAr ? "الحجم الموصى به: 1200×630 بكسل" : "Recommended size: 1200×630px"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── SITEMAP ── */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-4 w-4 text-primary" />
            {isAr ? "إعدادات خريطة الموقع" : "Sitemap Configuration"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "تحكم في المحتوى المضمّن في sitemap.xml لمحركات البحث" : "Control which content is included in sitemap.xml for search engines"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "autoUpdate" as const, en: "Sitemap Auto-Update", ar: "تحديث تلقائي لخريطة الموقع" },
            { key: "includeChefProfiles" as const, en: "Include chef profiles", ar: "تضمين صفحات الطهاة" },
            { key: "includeCompetitions" as const, en: "Include competition pages", ar: "تضمين صفحات المسابقات" },
            { key: "includeExhibitions" as const, en: "Include exhibition pages", ar: "تضمين صفحات المعارض" },
            { key: "includeAcademies" as const, en: "Include academy pages", ar: "تضمين صفحات الأكاديميات" },
            { key: "includeAssociations" as const, en: "Include association pages", ar: "تضمين صفحات الجمعيات" },
            { key: "includeBlogArticles" as const, en: "Include blog & articles", ar: "تضمين المدونة والمقالات" },
            { key: "includeEvents" as const, en: "Include event pages", ar: "تضمين صفحات الفعاليات" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-border/30 px-4 py-3 hover:bg-muted/30 transition-colors">
              <span className="text-sm">{isAr ? item.ar : item.en}</span>
              <Switch checked={sitemap[item.key]} onCheckedChange={val => setSitemap(p => ({ ...p, [item.key]: val }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} className="gap-2 min-w-[160px]">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isAr ? "حفظ إعدادات SEO" : "Save SEO Settings"}
        </Button>
      </div>
    </div>
  );
});
