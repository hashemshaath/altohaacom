import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompanyAccess, useCompanyProfile } from "@/hooks/useCompanyAccess";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Factory, ChevronRight, ChevronLeft, Check, Sparkles,
  Building2, Tag, Package, Phone, Image, Plus, X,
} from "lucide-react";

const SUPPLIER_CATEGORIES = [
  { value: "equipment", en: "Equipment", ar: "معدات" },
  { value: "food", en: "Food & Ingredients", ar: "أغذية ومكونات" },
  { value: "supplies", en: "Supplies", ar: "مستلزمات" },
  { value: "clothing", en: "Uniforms & Clothing", ar: "أزياء وملابس" },
  { value: "packaging", en: "Packaging", ar: "تغليف" },
  { value: "accessories", en: "Accessories & Tools", ar: "إكسسوارات وأدوات" },
];

interface WizardStep {
  key: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ElementType;
}

const WIZARD_STEPS: WizardStep[] = [
  { key: "activate", title: "Activate Profile", titleAr: "تفعيل الملف", description: "Enable your Pro Supplier listing", descriptionAr: "فعّل ظهورك في دليل الموردين المحترفين", icon: Factory },
  { key: "identity", title: "Brand Identity", titleAr: "الهوية التجارية", description: "Set your category and tagline", descriptionAr: "حدد تصنيفك وشعارك", icon: Tag },
  { key: "visuals", title: "Visuals", titleAr: "المظهر البصري", description: "Add logo and cover image", descriptionAr: "أضف الشعار وصورة الغلاف", icon: Image },
  { key: "specializations", title: "Specializations", titleAr: "التخصصات", description: "Define your expertise areas", descriptionAr: "حدد مجالات خبرتك", icon: Sparkles },
  { key: "contact", title: "Contact Info", titleAr: "معلومات الاتصال", description: "How buyers can reach you", descriptionAr: "كيف يمكن للمشترين التواصل معك", icon: Phone },
];

interface SupplierOnboardingWizardProps {
  onComplete: () => void;
}

export function SupplierOnboardingWizard({ onComplete }: SupplierOnboardingWizardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const { data: company } = useCompanyProfile(companyId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const c = company as any;
  const [step, setStep] = useState(0);
  const [isProSupplier, setIsProSupplier] = useState(c?.is_pro_supplier || false);
  const [category, setCategory] = useState(c?.supplier_category || "");
  const [tagline, setTagline] = useState(c?.tagline || "");
  const [taglineAr, setTaglineAr] = useState(c?.tagline_ar || "");
  const [foundedYear, setFoundedYear] = useState(c?.founded_year?.toString() || "");
  const [coverImageUrl, setCoverImageUrl] = useState(c?.cover_image_url || "");
  const [specializations, setSpecializations] = useState<string[]>(c?.specializations || []);
  const [newSpec, setNewSpec] = useState("");

  const totalSteps = WIZARD_STEPS.length;
  const currentStep = WIZARD_STEPS[step];
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase
        .from("companies")
        .update({
          is_pro_supplier: isProSupplier,
          supplier_category: category || null,
          tagline: tagline || null,
          tagline_ar: taglineAr || null,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
          cover_image_url: coverImageUrl || null,
          specializations: specializations.length > 0 ? specializations : null,
        } as any)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProfile", companyId] });
    },
  });

  const handleNext = async () => {
    await saveMutation.mutateAsync();
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      toast({ title: isAr ? "تم إعداد ملف المورد بنجاح! 🎉" : "Supplier profile setup complete! 🎉" });
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const addSpec = () => {
    if (newSpec.trim() && !specializations.includes(newSpec.trim())) {
      setSpecializations([...specializations, newSpec.trim()]);
      setNewSpec("");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {isAr ? `الخطوة ${step + 1} من ${totalSteps}` : `Step ${step + 1} of ${totalSteps}`}
          </span>
          <Badge variant="outline" className="text-xs">{progress}%</Badge>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between gap-1">
          {WIZARD_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/10 text-primary cursor-pointer"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{isAr ? s.titleAr : s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const Icon = currentStep.icon; return <Icon className="h-5 w-5 text-primary" />; })()}
            {isAr ? currentStep.titleAr : currentStep.title}
          </CardTitle>
          <CardDescription>{isAr ? currentStep.descriptionAr : currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{isAr ? "تفعيل ملف المورد المحترف" : "Activate Pro Supplier Profile"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? "سيظهر ملفك في دليل الموردين المحترفين" : "Your profile will appear in the Pro Suppliers Directory"}
                  </p>
                </div>
                <Switch checked={isProSupplier} onCheckedChange={setIsProSupplier} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>{isAr ? "التصنيف" : "Category"}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر التصنيف" : "Select category"} /></SelectTrigger>
                  <SelectContent>
                    {SUPPLIER_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الشعار (إنجليزي)" : "Tagline (English)"}</Label>
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Professional chef equipment since 1990" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الشعار (عربي)" : "Tagline (Arabic)"}</Label>
                <Input value={taglineAr} onChange={(e) => setTaglineAr(e.target.value)} dir="rtl" placeholder="معدات الشيفات المحترفين منذ ١٩٩٠" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "سنة التأسيس" : "Founded Year"}</Label>
                <Input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="2000" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>{isAr ? "رابط صورة الغلاف" : "Cover Image URL"}</Label>
                <Input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              {coverImageUrl && (
                <div className="relative rounded-xl overflow-hidden h-40 bg-muted">
                  <img src={coverImageUrl} className="h-full w-full object-cover" alt="Cover preview" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? "يمكنك تحديث شعار الشركة من إعدادات الشركة الرئيسية"
                  : "You can update your company logo from the main company settings"}
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {specializations.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <button onClick={() => setSpecializations(specializations.filter((x) => x !== s))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {specializations.length === 0 && (
                  <p className="text-xs text-muted-foreground">{isAr ? "لا توجد تخصصات بعد" : "No specializations added yet"}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  placeholder={isAr ? "مثال: أفران صناعية" : "e.g. Industrial ovens"}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpec())}
                />
                <Button size="sm" variant="outline" onClick={addSpec}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? "تأكد من أن معلومات الاتصال محدثة في إعدادات الشركة. يمكنك تحديث الهاتف والبريد والموقع من صفحة إعدادات الشركة."
                  : "Make sure your contact information is up to date in your company settings. You can update phone, email, and website from the company settings page."}
              </p>
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{c?.phone || (isAr ? "لم يُضاف بعد" : "Not added yet")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{c?.email || (isAr ? "لم يُضاف بعد" : "Not added yet")}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 0}>
          <ChevronLeft className="me-1 h-4 w-4" />
          {isAr ? "السابق" : "Back"}
        </Button>
        <Button onClick={handleNext} disabled={saveMutation.isPending}>
          {step === totalSteps - 1 ? (
            <>
              <Check className="me-1 h-4 w-4" />
              {isAr ? "إنهاء الإعداد" : "Finish Setup"}
            </>
          ) : (
            <>
              {isAr ? "التالي" : "Next"}
              <ChevronRight className="ms-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
