import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, PanelTop, PanelBottom, Link as LinkIcon, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

export function HeaderFooterSettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const headerCfg = settings.header || {};
  const footerCfg = settings.footer || {};

  const [header, setHeader] = useState(headerCfg);
  const [footer, setFooter] = useState(footerCfg);

  useEffect(() => { setHeader(headerCfg); }, [JSON.stringify(headerCfg)]);
  useEffect(() => { setFooter(footerCfg); }, [JSON.stringify(footerCfg)]);

  const headerToggles = [
    { key: "showLogo", en: "Show Logo", ar: "عرض الشعار", descEn: "Display brand logo in the header", descAr: "عرض شعار العلامة التجارية في الرأس" },
    { key: "showBrandName", en: "Show Brand Name", ar: "عرض اسم العلامة", descEn: "Display brand name next to logo", descAr: "عرض اسم العلامة بجانب الشعار" },
    { key: "showSearch", en: "Show Search", ar: "عرض البحث", descEn: "Enable quick search in header", descAr: "تمكين البحث السريع في الرأس" },
    { key: "showNotifications", en: "Show Notifications", ar: "عرض الإشعارات", descEn: "Display notification bell", descAr: "عرض جرس الإشعارات" },
    { key: "showThemeToggle", en: "Theme Toggle", ar: "تبديل السمة", descEn: "Show dark/light mode switcher", descAr: "عرض مبدل الوضع الداكن/الفاتح" },
    { key: "showLanguageSwitcher", en: "Language Switcher", ar: "تبديل اللغة", descEn: "Show EN/AR language switcher", descAr: "عرض مبدل اللغة إنجليزي/عربي" },
    { key: "stickyHeader", en: "Sticky Header", ar: "رأس ثابت", descEn: "Keep header fixed on scroll", descAr: "إبقاء الرأس ثابتاً عند التمرير" },
  ];

  const footerToggles = [
    { key: "showFooter", en: "Show Footer", ar: "عرض التذييل", descEn: "Display site footer", descAr: "عرض تذييل الموقع" },
    { key: "showSocialLinks", en: "Social Links", ar: "روابط التواصل", descEn: "Show social media icons", descAr: "عرض أيقونات التواصل الاجتماعي" },
    { key: "showNewsletter", en: "Newsletter Signup", ar: "اشتراك النشرة", descEn: "Show email newsletter form", descAr: "عرض نموذج الاشتراك بالنشرة" },
  ];

  const socialFields = [
    { key: "instagramUrl", en: "Instagram URL", ar: "رابط إنستغرام", placeholder: "https://instagram.com/..." },
    { key: "xUrl", en: "X (Twitter) URL", ar: "رابط X (تويتر)", placeholder: "https://x.com/..." },
    { key: "linkedinUrl", en: "LinkedIn URL", ar: "رابط لينكدإن", placeholder: "https://linkedin.com/..." },
    { key: "youtubeUrl", en: "YouTube URL", ar: "رابط يوتيوب", placeholder: "https://youtube.com/..." },
    { key: "tiktokUrl", en: "TikTok URL", ar: "رابط تيك توك", placeholder: "https://tiktok.com/..." },
    { key: "snapchatUrl", en: "Snapchat URL", ar: "رابط سناب شات", placeholder: "https://snapchat.com/..." },
  ];

  const headerEnabledCount = headerToggles.filter(t => header[t.key] ?? true).length;
  const footerEnabledCount = footerToggles.filter(t => footer[t.key] ?? true).length;
  const socialFilledCount = socialFields.filter(f => footer[f.key]).length;

  return (
    <div className="space-y-6">
      {/* Header Settings */}
      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <PanelTop className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  {isAr ? "إعدادات الرأس (Header)" : "Header Settings"}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {isAr ? "التحكم في مكونات ومظهر الرأس العلوي للموقع" : "Control header components and appearance across the site"}
                </CardDescription>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary tabular-nums">
              <CheckCircle2 className="h-3 w-3" />
              {headerEnabledCount}/{headerToggles.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {headerToggles.map(item => {
              const isOn = header[item.key] ?? true;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "group flex items-center justify-between rounded-xl border p-3 transition-all duration-200",
                    isOn
                      ? "border-primary/20 bg-primary/[0.03]"
                      : "border-border/30 bg-muted/20 opacity-75"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {isOn ? (
                      <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium leading-tight">{isAr ? item.ar : item.en}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{isAr ? item.descAr : item.descEn}</p>
                    </div>
                  </div>
                  <Switch checked={isOn} onCheckedChange={v => setHeader({ ...header, [item.key]: v })} />
                </div>
              );
            })}
          </div>
          <Button
            size="sm"
            className="gap-1.5 rounded-xl active:scale-95 transition-all shadow-sm shadow-primary/10"
            onClick={() => onSave("header", header, "layout")}
            disabled={isPending}
          >
            <Save className="h-3.5 w-3.5" />
            {isAr ? "حفظ إعدادات الرأس" : "Save Header Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Footer Settings */}
      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-accent/30 via-transparent to-transparent pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/60 ring-1 ring-accent-foreground/10">
                <PanelBottom className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  {isAr ? "إعدادات التذييل (Footer)" : "Footer Settings"}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {isAr ? "التحكم في محتوى التذييل وروابط التواصل الاجتماعي" : "Manage footer content and social media links"}
                </CardDescription>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-xl bg-accent/60 px-2.5 py-1 text-[11px] font-semibold text-accent-foreground tabular-nums">
              <CheckCircle2 className="h-3 w-3" />
              {footerEnabledCount}/{footerToggles.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-2">
          {/* Footer toggles */}
          <div className="grid gap-2 sm:grid-cols-2">
            {footerToggles.map(item => {
              const isOn = footer[item.key] ?? true;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "group flex items-center justify-between rounded-xl border p-3 transition-all duration-200",
                    isOn
                      ? "border-primary/20 bg-primary/[0.03]"
                      : "border-border/30 bg-muted/20 opacity-75"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {isOn ? (
                      <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium leading-tight">{isAr ? item.ar : item.en}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{isAr ? item.descAr : item.descEn}</p>
                    </div>
                  </div>
                  <Switch checked={isOn} onCheckedChange={v => setFooter({ ...footer, [item.key]: v })} />
                </div>
              );
            })}
          </div>

          <Separator className="bg-border/30" />

          {/* Copyright */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? "نص حقوق النشر (إنجليزي)" : "Copyright Text (English)"}</Label>
              <Input
                className="rounded-xl"
                value={footer.copyrightText || ""}
                onChange={e => setFooter({ ...footer, copyrightText: e.target.value })}
                placeholder="© {year} Altoha."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isAr ? "نص حقوق النشر (عربي)" : "Copyright Text (Arabic)"}</Label>
              <Input
                className="rounded-xl"
                value={footer.copyrightTextAr || ""}
                onChange={e => setFooter({ ...footer, copyrightTextAr: e.target.value })}
                dir="rtl"
              />
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Social Links */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                {isAr ? "روابط التواصل الاجتماعي" : "Social Media Links"}
              </h4>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {socialFilledCount}/{socialFields.length} {isAr ? "مكتمل" : "filled"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {socialFields.map(f => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs font-medium">{isAr ? f.ar : f.en}</Label>
                  <Input
                    className="h-9 rounded-xl text-sm"
                    value={footer[f.key] || ""}
                    onChange={e => setFooter({ ...footer, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            className="gap-1.5 rounded-xl active:scale-95 transition-all shadow-sm shadow-primary/10"
            onClick={() => onSave("footer", footer, "layout")}
            disabled={isPending}
          >
            <Save className="h-3.5 w-3.5" />
            {isAr ? "حفظ إعدادات التذييل" : "Save Footer Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
