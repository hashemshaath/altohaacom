import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompanyAccess, useCompanyProfile } from "@/hooks/useCompanyAccess";
import { useCompanyPagePermissions } from "@/hooks/useCompanyPermissions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Factory, Save, Plus, X, Sparkles, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SUPPLIER_CATEGORIES = [
  { value: "equipment", en: "Equipment", ar: "معدات" },
  { value: "food", en: "Food & Ingredients", ar: "أغذية ومكونات" },
  { value: "supplies", en: "Supplies", ar: "مستلزمات" },
  { value: "clothing", en: "Uniforms & Clothing", ar: "أزياء وملابس" },
  { value: "packaging", en: "Packaging", ar: "تغليف" },
  { value: "accessories", en: "Accessories & Tools", ar: "إكسسوارات وأدوات" },
];

export default function CompanySupplierProfile() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const { data: company } = useCompanyProfile(companyId);
  const permissions = useCompanyPagePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [tagline, setTagline] = useState("");
  const [taglineAr, setTaglineAr] = useState("");
  const [supplierCategory, setSupplierCategory] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState("");
  const [isProSupplier, setIsProSupplier] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");

  useEffect(() => {
    if (company) {
      const c = company as any;
      setTagline(c.tagline || "");
      setTaglineAr(c.tagline_ar || "");
      setSupplierCategory(c.supplier_category || "");
      setFoundedYear(c.founded_year?.toString() || "");
      setSpecializations(c.specializations || []);
      setIsProSupplier(c.is_pro_supplier || false);
      setCoverImageUrl(c.cover_image_url || "");
      setSocialLinks(c.social_links || {});
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase
        .from("companies")
        .update({
          tagline: tagline || null,
          tagline_ar: taglineAr || null,
          supplier_category: supplierCategory || null,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
          specializations: specializations.length > 0 ? specializations : null,
          is_pro_supplier: isProSupplier,
          cover_image_url: coverImageUrl || null,
          social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        } as any)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProfile", companyId] });
      toast({ title: isAr ? "تم حفظ ملف المورد" : "Supplier profile saved" });
    },
    onError: () => toast({ title: isAr ? "فشل الحفظ" : "Save failed", variant: "destructive" }),
  });

  const addSpecialization = () => {
    if (newSpec.trim() && !specializations.includes(newSpec.trim())) {
      setSpecializations([...specializations, newSpec.trim()]);
      setNewSpec("");
    }
  };

  const addSocialLink = () => {
    if (newSocialPlatform.trim() && newSocialUrl.trim()) {
      setSocialLinks({ ...socialLinks, [newSocialPlatform.trim().toLowerCase()]: newSocialUrl.trim() });
      setNewSocialPlatform("");
      setNewSocialUrl("");
    }
  };

  const canEdit = permissions.canEditProfile;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Factory className="h-6 w-6 text-primary" />
            {isAr ? "ملف المورد المحترف" : "Pro Supplier Profile"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "إدارة تواجدك في دليل الموردين المحترفين" : "Manage your presence in the Pro Suppliers Directory"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/pro-suppliers/${companyId}`)}>
            <Eye className="me-1.5 h-3.5 w-3.5" />
            {isAr ? "معاينة" : "Preview"}
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "حفظ" : "Save"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Visibility & Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "الظهور والتصنيف" : "Visibility & Category"}</CardTitle>
            <CardDescription>{isAr ? "تحكم في ظهورك في الدليل" : "Control your directory listing"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{isAr ? "مورد محترف مفعّل" : "Pro Supplier Active"}</Label>
              <Switch checked={isProSupplier} onCheckedChange={setIsProSupplier} disabled={!canEdit} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "التصنيف" : "Category"}</Label>
              <Select value={supplierCategory} onValueChange={setSupplierCategory} disabled={!canEdit}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر التصنيف" : "Select category"} /></SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "سنة التأسيس" : "Founded Year"}</Label>
              <Input type="number" value={foundedYear} onChange={e => setFoundedYear(e.target.value)} disabled={!canEdit} placeholder="2000" />
            </div>
          </CardContent>
        </Card>

        {/* Tagline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "الشعار والوصف المختصر" : "Tagline"}</CardTitle>
            <CardDescription>{isAr ? "وصف مختصر يظهر في البطاقة" : "Short description shown on your card"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? "الشعار (إنجليزي)" : "Tagline (English)"}</Label>
              <Input value={tagline} onChange={e => setTagline(e.target.value)} disabled={!canEdit} placeholder="Professional chef equipment since 1990" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الشعار (عربي)" : "Tagline (Arabic)"}</Label>
              <Input value={taglineAr} onChange={e => setTaglineAr(e.target.value)} disabled={!canEdit} dir="rtl" placeholder="معدات الشيفات المحترفين منذ ١٩٩٠" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "صورة الغلاف (رابط)" : "Cover Image URL"}</Label>
              <Input value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} disabled={!canEdit} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        {/* Specializations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {isAr ? "التخصصات" : "Specializations"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {specializations.map(s => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  {canEdit && (
                    <button onClick={() => setSpecializations(specializations.filter(x => x !== s))}>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {specializations.length === 0 && (
                <p className="text-xs text-muted-foreground">{isAr ? "لا توجد تخصصات" : "No specializations added"}</p>
              )}
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Input value={newSpec} onChange={e => setNewSpec(e.target.value)} placeholder={isAr ? "إضافة تخصص" : "Add specialization"} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSpecialization())} />
                <Button size="sm" variant="outline" onClick={addSpecialization}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "وسائل التواصل" : "Social Media Links"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(socialLinks).map(([platform, url]) => (
              <div key={platform} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="capitalize">{platform}</Badge>
                <span className="flex-1 truncate text-muted-foreground">{url}</span>
                {canEdit && (
                  <button onClick={() => {
                    const copy = { ...socialLinks };
                    delete copy[platform];
                    setSocialLinks(copy);
                  }}><X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
                )}
              </div>
            ))}
            {canEdit && (
              <div className="flex gap-2">
                <Input value={newSocialPlatform} onChange={e => setNewSocialPlatform(e.target.value)} placeholder={isAr ? "المنصة" : "Platform"} className="w-28" />
                <Input value={newSocialUrl} onChange={e => setNewSocialUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                <Button size="sm" variant="outline" onClick={addSocialLink}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
