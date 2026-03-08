import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, PanelTop, PanelBottom, Link as LinkIcon } from "lucide-react";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

export const HeaderFooterSettings = memo(function HeaderFooterSettings({ settings, onSave, isPending }: Props) {
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

  return (
    <div className="space-y-6">
      {/* Header Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PanelTop className="h-4.5 w-4.5 text-primary" />
            {isAr ? "إعدادات الرأس (Header)" : "Header Settings"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "التحكم في مكونات ومظهر الرأس العلوي للموقع" : "Control header components and appearance across the site"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {headerToggles.map(item => (
              <div key={item.key} className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                <div>
                  <p className="text-sm font-medium">{isAr ? item.ar : item.en}</p>
                  <p className="text-[11px] text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
                </div>
                <Switch checked={header[item.key] ?? true} onCheckedChange={v => setHeader({ ...header, [item.key]: v })} />
              </div>
            ))}
          </div>
          <Button size="sm" className="gap-1.5 mt-2" onClick={() => onSave("header", header, "layout")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ إعدادات الرأس" : "Save Header Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Footer Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PanelBottom className="h-4.5 w-4.5 text-primary" />
            {isAr ? "إعدادات التذييل (Footer)" : "Footer Settings"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "التحكم في محتوى التذييل وروابط التواصل الاجتماعي" : "Manage footer content and social media links"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {footerToggles.map(item => (
              <div key={item.key} className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                <div>
                  <p className="text-sm font-medium">{isAr ? item.ar : item.en}</p>
                  <p className="text-[11px] text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
                </div>
                <Switch checked={footer[item.key] ?? true} onCheckedChange={v => setFooter({ ...footer, [item.key]: v })} />
              </div>
            ))}
          </div>

          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "نص حقوق النشر (إنجليزي)" : "Copyright Text (English)"}</Label>
              <Input value={footer.copyrightText || ""} onChange={e => setFooter({ ...footer, copyrightText: e.target.value })} placeholder="© {year} Altoha." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "نص حقوق النشر (عربي)" : "Copyright Text (Arabic)"}</Label>
              <Input value={footer.copyrightTextAr || ""} onChange={e => setFooter({ ...footer, copyrightTextAr: e.target.value })} dir="rtl" />
            </div>
          </div>

          <Separator />
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <LinkIcon className="h-3.5 w-3.5 text-primary" />
            {isAr ? "روابط التواصل الاجتماعي" : "Social Media Links"}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {socialFields.map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{isAr ? f.ar : f.en}</Label>
                <Input className="h-8 text-sm" value={footer[f.key] || ""} onChange={e => setFooter({ ...footer, [f.key]: e.target.value })} placeholder={f.placeholder} />
              </div>
            ))}
          </div>

          <Button size="sm" className="gap-1.5 mt-2" onClick={() => onSave("footer", footer, "layout")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ إعدادات التذييل" : "Save Footer Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});
