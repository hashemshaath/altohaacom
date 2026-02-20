import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { countryFlag } from "@/lib/countryFlag";
import { SectionReveal } from "@/components/ui/section-reveal";
import { cn } from "@/lib/utils";
import { Building2, ArrowRight, Factory, CheckCircle, Package } from "lucide-react";

export function HomeProSuppliers() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const { data: suppliers = [] } = useQuery({
    queryKey: ["homeProSuppliers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, name_ar, logo_url, tagline, tagline_ar, city, country_code, is_verified, supplier_category, cover_image_url")
        .eq("status", "active")
        .eq("is_pro_supplier", true)
        .order("featured_order", { ascending: true, nullsFirst: false })
        .limit(6);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (suppliers.length === 0) return null;

  return (
    <SectionReveal>
      <section className="container py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Factory className="h-5 w-5 text-primary" />
              <h2 className={cn("text-2xl font-bold", !isAr && "font-serif")}>
                {isAr ? "الموردون المحترفون" : "Pro Suppliers"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? "شركات متخصصة في منتجات الشيفات المحترفين" : "Companies specializing in professional chef products"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/pro-suppliers")} className="hidden sm:flex">
            {isAr ? "عرض الكل" : "View All"}
            <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {suppliers.map((s: any) => (
            <Card
              key={s.id}
              interactive
              className="cursor-pointer overflow-hidden rounded-xl"
              onClick={() => navigate(`/pro-suppliers/${s.id}`)}
            >
              <CardContent className="p-4 text-center space-y-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
                  {s.logo_url ? (
                    <img src={s.logo_url} className="h-10 w-10 object-contain" alt={s.name} />
                  ) : (
                    <Building2 className="h-7 w-7 text-muted-foreground/40" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold truncate">{isAr && s.name_ar ? s.name_ar : s.name}</p>
                  {s.is_verified && (
                    <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 gap-0.5 text-[8px] mt-1">
                      <CheckCircle className="h-2 w-2" />{isAr ? "موثّق" : "Verified"}
                    </Badge>
                  )}
                </div>
                {s.country_code && (
                  <p className="text-[10px] text-muted-foreground">
                    {countryFlag(s.country_code)} {s.city || ""}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 text-center sm:hidden">
          <Button variant="outline" size="sm" onClick={() => navigate("/pro-suppliers")}>
            {isAr ? "عرض كل الموردين" : "View All Suppliers"}
            <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </section>
    </SectionReveal>
  );
}
