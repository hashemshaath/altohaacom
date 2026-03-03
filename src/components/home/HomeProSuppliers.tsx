import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { countryFlag } from "@/lib/countryFlag";
import { SectionReveal } from "@/components/ui/section-reveal";
import { cn } from "@/lib/utils";
import { Building2, Factory, CheckCircle, MapPin } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { FilterChip } from "./FilterChip";
import { localizeLocation } from "@/lib/localizeLocation";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

const SUPPLIER_CAT_LABELS: Record<string, { en: string; ar: string }> = {
  food: { en: "Food", ar: "أغذية" },
  equipment: { en: "Equipment", ar: "معدات" },
  packaging: { en: "Packaging", ar: "تغليف" },
  ingredients: { en: "Ingredients", ar: "مكونات" },
  beverages: { en: "Beverages", ar: "مشروبات" },
  uniforms: { en: "Uniforms", ar: "أزياء" },
  cleaning: { en: "Cleaning", ar: "تنظيف" },
  technology: { en: "Technology", ar: "تقنية" },
};

export function HomeProSuppliers() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const sectionConfig = useSectionConfig();

  const itemCount = sectionConfig?.item_count || 6;
  const showFilters = sectionConfig?.show_filters ?? true;
  const showViewAll = sectionConfig?.show_view_all ?? true;
  const sectionTitle = sectionConfig
    ? (isAr ? sectionConfig.title_ar || "شركاء التوريد المعتمدون" : sectionConfig.title_en || "Trusted Supply Partners")
    : (isAr ? "شركاء التوريد المعتمدون" : "Trusted Supply Partners");
  const sectionSubtitle = sectionConfig
    ? (isAr ? sectionConfig.subtitle_ar || "" : sectionConfig.subtitle_en || "")
    : (isAr ? "شركات متخصصة في منتجات الشيفات المحترفين" : "Companies specializing in professional chef products");

  const { data: suppliers = [] } = useQuery({
    queryKey: ["homeProSuppliers", itemCount],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, name_ar, logo_url, tagline, tagline_ar, city, country_code, is_verified, supplier_category, cover_image_url")
        .eq("status", "active")
        .eq("is_pro_supplier", true)
        .order("featured_order", { ascending: true, nullsFirst: false })
        .limit(itemCount);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const categories = useMemo(() => {
    const s = new Set<string>();
    suppliers.forEach((sup: any) => { if (sup.supplier_category) s.add(sup.supplier_category); });
    return Array.from(s);
  }, [suppliers]);

  const filtered = useMemo(() => {
    if (!catFilter) return suppliers;
    return suppliers.filter((s: any) => s.supplier_category === catFilter);
  }, [suppliers, catFilter]);

  if (suppliers.length === 0) return null;

  const gridCols = itemCount <= 4 ? "lg:grid-cols-4" : "lg:grid-cols-6";

  return (
    <SectionReveal>
      <section className="container py-8 md:py-12" dir={isAr ? "rtl" : "ltr"}>
        <SectionHeader
          icon={Factory}
          badge={isAr ? "الموردون المحترفون" : "Pro Suppliers"}
          title={sectionTitle}
          subtitle={sectionSubtitle}
          dataSource="companies (is_pro_supplier)"
          itemCount={filtered.length}
          viewAllHref={showViewAll ? "/pro-suppliers" : undefined}
          isAr={isAr}
          filters={showFilters && categories.length > 1 ? (
            <>
              <FilterChip label={isAr ? "الكل" : "All"} active={!catFilter} count={suppliers.length} onClick={() => setCatFilter(null)} />
              {categories.map(c => {
                const cl = SUPPLIER_CAT_LABELS[c.toLowerCase()];
                return (
                <FilterChip
                  key={c}
                  label={cl ? (isAr ? cl.ar : cl.en) : c}
                  active={catFilter === c}
                  count={suppliers.filter((s: any) => s.supplier_category === c).length}
                  onClick={() => setCatFilter(catFilter === c ? null : c)}
                />
                );
              })}
            </>
          ) : undefined}
        />

        <div className={cn("grid gap-3 grid-cols-2 sm:grid-cols-3", gridCols)}>
          {filtered.map((s: any) => {
            const name = isAr && s.name_ar ? s.name_ar : s.name;
            const tagline = isAr && s.tagline_ar ? s.tagline_ar : s.tagline;
            return (
              <Card
                key={s.id}
                interactive
                className="cursor-pointer overflow-hidden border-border/40"
                onClick={() => navigate(`/pro-suppliers/${s.id}`)}
              >
                <CardContent className="p-3 sm:p-4 text-center space-y-2">
                  <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/30 transition-transform duration-300 group-hover:scale-110">
                    {s.logo_url ? (
                      <img src={s.logo_url} className="h-9 w-9 sm:h-10 sm:w-10 object-contain" alt={name} loading="lazy" />
                    ) : (
                      <Building2 className="h-7 w-7 text-muted-foreground/40" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate text-foreground">{name}</p>
                    {s.supplier_category && (
                      <Badge variant="outline" className="text-[9px] mt-1">{(() => { const cl = SUPPLIER_CAT_LABELS[s.supplier_category.toLowerCase()]; return cl ? (isAr ? cl.ar : cl.en) : s.supplier_category; })()}</Badge>
                    )}
                    {s.is_verified && (
                      <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 gap-0.5 text-[8px] mt-1 ms-1">
                        <CheckCircle className="h-2 w-2" />{isAr ? "موثّق" : "Verified"}
                      </Badge>
                    )}
                  </div>
                  {tagline && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{tagline}</p>
                  )}
                  {s.country_code && (
                    <p className="text-[10px] text-muted-foreground/70 flex items-center justify-center gap-1">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      {countryFlag(s.country_code)} {localizeLocation({ city: s.city, countryCode: s.country_code }, isAr)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </SectionReveal>
  );
}
