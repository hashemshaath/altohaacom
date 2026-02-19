import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Save, Globe, Image, Mail, FileText } from "lucide-react";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

export function BrandingSettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const branding = settings.branding || {};
  const registration = settings.registration || {};

  const [brand, setBrand] = useState(branding);
  const [reg, setReg] = useState(registration);

  useEffect(() => { setBrand(branding); }, [JSON.stringify(branding)]);
  useEffect(() => { setReg(registration); }, [JSON.stringify(registration)]);

  return (
    <div className="space-y-6">
      {/* Brand Identity */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4.5 w-4.5 text-primary" />
            {isAr ? "هوية العلامة التجارية" : "Brand Identity"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "تكوين اسم الموقع والشعار ومعلومات الاتصال" : "Configure site name, logo, and contact information"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "اسم الموقع (إنجليزي)" : "Site Name (English)"}</Label>
              <Input value={brand.siteName || ""} onChange={e => setBrand({ ...brand, siteName: e.target.value })} placeholder="Altoha" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "اسم الموقع (عربي)" : "Site Name (Arabic)"}</Label>
              <Input value={brand.siteNameAr || ""} onChange={e => setBrand({ ...brand, siteNameAr: e.target.value })} placeholder="الطهاة" dir="rtl" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "وصف الموقع (إنجليزي)" : "Site Description (English)"}</Label>
              <Textarea rows={2} value={brand.siteDescription || ""} onChange={e => setBrand({ ...brand, siteDescription: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "وصف الموقع (عربي)" : "Site Description (Arabic)"}</Label>
              <Textarea rows={2} value={brand.siteDescriptionAr || ""} onChange={e => setBrand({ ...brand, siteDescriptionAr: e.target.value })} dir="rtl" />
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><Mail className="h-3 w-3" />{isAr ? "البريد الإلكتروني للتواصل" : "Contact Email"}</Label>
              <Input value={brand.contactEmail || ""} onChange={e => setBrand({ ...brand, contactEmail: e.target.value })} placeholder="info@altoha.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><Image className="h-3 w-3" />{isAr ? "رابط الشعار" : "Logo URL"}</Label>
              <Input value={brand.logoUrl || ""} onChange={e => setBrand({ ...brand, logoUrl: e.target.value })} placeholder="/altoha-logo.png" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><FileText className="h-3 w-3" />{isAr ? "رابط الأيقونة المفضلة" : "Favicon URL"}</Label>
            <Input value={brand.faviconUrl || ""} onChange={e => setBrand({ ...brand, faviconUrl: e.target.value })} placeholder="/favicon.ico" />
          </div>
          <Button size="sm" className="gap-1.5 mt-2" onClick={() => onSave("branding", brand, "general")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ العلامة التجارية" : "Save Branding"}
          </Button>
        </CardContent>
      </Card>

      {/* Registration & Access */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">{isAr ? "التسجيل والوصول" : "Registration & Access"}</CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "التحكم في تسجيل المستخدمين الجدد ووضع الصيانة" : "Control new user registration and maintenance mode"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "allowRegistration", en: "Allow Registration", ar: "السماح بالتسجيل", descEn: "Allow new users to sign up", descAr: "السماح للمستخدمين الجدد بالتسجيل" },
            { key: "requireEmailVerification", en: "Email Verification", ar: "التحقق من البريد", descEn: "Require email verification before login", descAr: "طلب التحقق من البريد الإلكتروني قبل الدخول" },
            { key: "allowSocialLogin", en: "Social Login", ar: "تسجيل اجتماعي", descEn: "Allow Google/social login", descAr: "السماح بتسجيل الدخول عبر جوجل" },
            { key: "maintenanceMode", en: "Maintenance Mode", ar: "وضع الصيانة", descEn: "Temporarily disable user access", descAr: "تعطيل الوصول للمستخدمين مؤقتاً" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
              <div>
                <p className="text-sm font-medium">{isAr ? item.ar : item.en}</p>
                <p className="text-xs text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
              </div>
              <Switch checked={reg[item.key] ?? false} onCheckedChange={v => setReg({ ...reg, [item.key]: v })} />
            </div>
          ))}
          <Button size="sm" className="gap-1.5 mt-2" onClick={() => onSave("registration", reg, "general")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ التسجيل" : "Save Registration"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
