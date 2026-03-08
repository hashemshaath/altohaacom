import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Globe, Mail, FileText } from "lucide-react";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

export const BrandingSettings = memo(function BrandingSettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const branding = settings.branding || {};

  const [brand, setBrand] = useState(branding);

  useEffect(() => { setBrand(branding); }, [JSON.stringify(branding)]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4.5 w-4.5 text-primary" />
          {isAr ? "هوية العلامة التجارية" : "Brand Identity"}
        </CardTitle>
        <CardDescription className="text-xs">
          {isAr ? "اسم الموقع والوصف ومعلومات الاتصال — الشعارات تُدار من تبويب الهوية البصرية" : "Site name, description & contact info — logos are managed in the Visual Identity tab"}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><Mail className="h-3 w-3" />{isAr ? "البريد الإلكتروني للتواصل" : "Contact Email"}</Label>
            <Input value={brand.contactEmail || ""} onChange={e => setBrand({ ...brand, contactEmail: e.target.value })} placeholder="info@altoha.com" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><FileText className="h-3 w-3" />{isAr ? "رابط الأيقونة المفضلة" : "Favicon URL"}</Label>
            <Input value={brand.faviconUrl || ""} onChange={e => setBrand({ ...brand, faviconUrl: e.target.value })} placeholder="/favicon.ico" />
          </div>
        </div>
        <Button size="sm" className="gap-1.5 mt-2" onClick={() => onSave("branding", brand, "general")} disabled={isPending}>
          <Save className="h-3.5 w-3.5" />{isAr ? "حفظ العلامة التجارية" : "Save Branding"}
        </Button>
      </CardContent>
    </Card>
  );
}
