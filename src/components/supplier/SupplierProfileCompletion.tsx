import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompanyAccess, useCompanyProfile } from "@/hooks/useCompanyAccess";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Sparkles } from "lucide-react";

interface Step {
  key: string;
  label: string;
  labelAr: string;
  check: (company: any, products: any[]) => boolean;
  tip: string;
  tipAr: string;
}

const STEPS: Step[] = [
  {
    key: "pro_active",
    label: "Enable Pro Supplier",
    labelAr: "تفعيل المورد المحترف",
    check: (c) => !!c?.is_pro_supplier,
    tip: "Toggle 'Pro Supplier Active' in your profile settings",
    tipAr: "فعّل 'مورد محترف مفعّل' في إعدادات ملفك",
  },
  {
    key: "category",
    label: "Set category",
    labelAr: "اختيار التصنيف",
    check: (c) => !!c?.supplier_category,
    tip: "Choose a supplier category so buyers can find you",
    tipAr: "اختر تصنيف المورد ليسهل على المشترين إيجادك",
  },
  {
    key: "tagline",
    label: "Add tagline",
    labelAr: "إضافة شعار",
    check: (c) => !!(c?.tagline || c?.tagline_ar),
    tip: "A catchy tagline helps your card stand out",
    tipAr: "شعار جذاب يساعد بطاقتك على التميز",
  },
  {
    key: "logo",
    label: "Upload logo",
    labelAr: "رفع الشعار",
    check: (c) => !!c?.logo_url,
    tip: "Add your company logo for brand recognition",
    tipAr: "أضف شعار شركتك للتعرف على العلامة التجارية",
  },
  {
    key: "cover",
    label: "Add cover image",
    labelAr: "إضافة صورة غلاف",
    check: (c) => !!c?.cover_image_url,
    tip: "A cover image makes your profile more appealing",
    tipAr: "صورة الغلاف تجعل ملفك أكثر جاذبية",
  },
  {
    key: "specializations",
    label: "Add specializations",
    labelAr: "إضافة تخصصات",
    check: (c) => c?.specializations?.length > 0,
    tip: "List your expertise areas to attract the right buyers",
    tipAr: "أضف مجالات خبرتك لجذب المشترين المناسبين",
  },
  {
    key: "products",
    label: "Add products",
    labelAr: "إضافة منتجات",
    check: (_c, p) => p.length > 0,
    tip: "Showcase your products in the catalog",
    tipAr: "اعرض منتجاتك في الكتالوج",
  },
  {
    key: "contact",
    label: "Add contact info",
    labelAr: "إضافة معلومات الاتصال",
    check: (c) => !!(c?.phone || c?.email),
    tip: "Provide phone or email so buyers can reach you",
    tipAr: "أضف هاتف أو بريد إلكتروني ليتمكن المشترون من التواصل معك",
  },
];

export const SupplierProfileCompletion = memo(function SupplierProfileCompletion() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const { data: company } = useCompanyProfile(companyId);

  const { data: products = [] } = useQuery({
    queryKey: ["supplierCompletionProducts", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_catalog")
        .select("id")
        .eq("company_id", companyId)
        .limit(1);
      return data || [];
    },
    enabled: !!companyId,
  });

  const c = company;
  const completed = STEPS.filter((s) => s.check(c, products));
  const pct = Math.round((completed.length / STEPS.length) * 100);
  const nextStep = STEPS.find((s) => !s.check(c, products));

  if (pct === 100) return null; // Hide when complete

  return (
    <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {isAr ? "إكمال الملف" : "Profile Completion"}
          </CardTitle>
          <Badge variant="outline" className="text-xs font-semibold">
            {pct}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={pct} className="h-2" />

        {nextStep && (
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
            <p className="text-xs font-medium text-primary">
              {isAr ? "الخطوة التالية:" : "Next step:"}
            </p>
            <p className="text-sm mt-0.5">{isAr ? nextStep.tipAr : nextStep.tip}</p>
          </div>
        )}

        <div className="grid gap-1.5">
          {STEPS.map((step) => {
            const done = step.check(c, products);
            return (
              <div key={step.key} className="flex items-center gap-2 text-sm">
                {done ? (
                  <CheckCircle className="h-3.5 w-3.5 text-chart-5 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                )}
                <span className={done ? "text-muted-foreground line-through" : ""}>
                  {isAr ? step.labelAr : step.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
