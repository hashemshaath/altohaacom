import { memo } from "react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, LayoutGrid, Newspaper } from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
  {
    id: "v1",
    nameEn: "Classic",
    nameAr: "كلاسيكي",
    descEn: "Standard sections with category cards, regional filters, calendar, and sponsor carousels.",
    descAr: "أقسام قياسية مع بطاقات الفئات والفلاتر والتقويم ودوارات الرعاة.",
    icon: LayoutGrid,
  },
  {
    id: "v2",
    nameEn: "Immersive Visual",
    nameAr: "تجربة بصرية غامرة",
    descEn: "Cinematic full-bleed hero with parallax, dramatic scroll reveals, dark event showcase, and immersive CTA.",
    descAr: "بطل سينمائي كامل مع تأثير المنظر، كشف درامي عند التمرير، عرض أحداث داكن، ودعوة غامرة.",
    icon: Newspaper,
  },
];

export function HomepageTemplateSwitcher() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const settings = useSiteSettingsContext();
  const current = (settings?.homepage as any)?.template || "v1";
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (templateId: string) => {
      const existing = settings?.homepage || {};
      const newVal = { ...existing, template: templateId };
      const { error } = await supabase
        .from("site_settings")
        .update({ value: newVal as any })
        .eq("key", "homepage");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings-global"] });
      toast.success(isAr ? "تم تغيير قالب الصفحة الرئيسية" : "Homepage template updated");
    },
    onError: () => {
      toast.error(isAr ? "فشل التحديث" : "Failed to update");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isAr ? "قالب الصفحة الرئيسية" : "Homepage Template"}</CardTitle>
        <CardDescription>{isAr ? "اختر تصميم الصفحة الرئيسية" : "Choose the homepage design"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => {
            const isActive = current === t.id;
            return (
              <button
                key={t.id}
                onClick={() => !isActive && mutation.mutate(t.id)}
                disabled={mutation.isPending}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-start transition-all",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                {isActive && (
                  <div className="absolute top-3 end-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", isActive ? "bg-primary/15" : "bg-muted")}>
                    <t.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{isAr ? t.nameAr : t.nameEn}</p>
                    {isActive && <Badge variant="secondary" className="text-[9px] mt-0.5">{isAr ? "نشط" : "Active"}</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr ? t.descAr : t.descEn}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
