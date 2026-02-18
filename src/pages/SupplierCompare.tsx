import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupplierBadges } from "@/components/supplier/SupplierBadges";
import { countryFlag } from "@/lib/countryFlag";
import {
  Building2, ArrowLeft, Search, Plus, X, Package, Star,
  Phone, Mail, Globe, MapPin, CheckCircle, Scale,
} from "lucide-react";

const MAX_COMPARE = 4;

export default function SupplierCompare() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const [searchParams, setSearchParams] = useSearchParams();
  const initialIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // Fetch all pro suppliers for picker
  const { data: allSuppliers = [] } = useQuery({
    queryKey: ["allProSuppliers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, name_ar, logo_url, supplier_category, country_code, city, is_verified")
        .eq("status", "active")
        .eq("is_pro_supplier", true)
        .order("name");
      return data || [];
    },
  });

  // Fetch selected suppliers details
  const { data: selectedSuppliers = [] } = useQuery({
    queryKey: ["compareSuppliers", selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return [];
      const { data } = await supabase
        .from("companies")
        .select("*")
        .in("id", selectedIds)
        .eq("status", "active");
      return data || [];
    },
    enabled: selectedIds.length > 0,
  });

  // Fetch product counts
  const { data: productCounts = {} } = useQuery({
    queryKey: ["compareProductCounts", selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return {};
      const { data } = await supabase
        .from("company_catalog")
        .select("company_id")
        .in("company_id", selectedIds)
        .eq("is_active", true);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.company_id] = (counts[r.company_id] || 0) + 1;
      });
      return counts;
    },
    enabled: selectedIds.length > 0,
  });

  // Fetch review stats
  const { data: reviewStats = {} } = useQuery({
    queryKey: ["compareReviewStats", selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return {};
      const { data } = await supabase
        .from("supplier_reviews")
        .select("company_id, rating")
        .in("company_id", selectedIds)
        .eq("status", "published");
      const stats: Record<string, { count: number; avg: number }> = {};
      (data || []).forEach((r: any) => {
        if (!stats[r.company_id]) stats[r.company_id] = { count: 0, avg: 0 };
        stats[r.company_id].count++;
      });
      // Calculate averages
      const grouped: Record<string, number[]> = {};
      (data || []).forEach((r: any) => {
        if (!grouped[r.company_id]) grouped[r.company_id] = [];
        grouped[r.company_id].push(r.rating);
      });
      Object.keys(grouped).forEach((id) => {
        const ratings = grouped[id];
        stats[id] = {
          count: ratings.length,
          avg: ratings.reduce((s, r) => s + r, 0) / ratings.length,
        };
      });
      return stats;
    },
    enabled: selectedIds.length > 0,
  });

  const addSupplier = (id: string) => {
    if (selectedIds.length >= MAX_COMPARE || selectedIds.includes(id)) return;
    const newIds = [...selectedIds, id];
    setSelectedIds(newIds);
    setSearchParams({ ids: newIds.join(",") });
    setShowPicker(false);
    setSearchTerm("");
  };

  const removeSupplier = (id: string) => {
    const newIds = selectedIds.filter((i) => i !== id);
    setSelectedIds(newIds);
    setSearchParams(newIds.length > 0 ? { ids: newIds.join(",") } : {});
  };

  const filteredPicker = useMemo(() => {
    return allSuppliers.filter((s: any) => {
      if (selectedIds.includes(s.id)) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return s.name?.toLowerCase().includes(term) || s.name_ar?.toLowerCase().includes(term);
    });
  }, [allSuppliers, selectedIds, searchTerm]);

  const orderedSuppliers = selectedIds
    .map((id) => selectedSuppliers.find((s: any) => s.id === id))
    .filter(Boolean) as any[];

  const CompareRow = ({ label, render }: { label: string; render: (s: any) => React.ReactNode }) => (
    <div className="grid border-b border-border/40" style={{ gridTemplateColumns: `200px repeat(${orderedSuppliers.length}, 1fr)` }}>
      <div className="p-3 text-sm font-medium text-muted-foreground bg-muted/30 flex items-center">{label}</div>
      {orderedSuppliers.map((s) => (
        <div key={s.id} className="p-3 text-sm flex items-center">{render(s)}</div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={isAr ? "مقارنة الموردين | التحاء" : "Compare Suppliers | Altohaa"}
        description={isAr ? "قارن بين الموردين المحترفين جنباً إلى جنب" : "Compare professional suppliers side by side"}
      />
      <Header />
      <main className="flex-1">
        <div className="container py-6 md:py-10">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/pro-suppliers")}>
              <ArrowLeft className="me-2 h-4 w-4" />{isAr ? "الدليل" : "Directory"}
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                {isAr ? "مقارنة الموردين" : "Compare Suppliers"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAr ? `اختر حتى ${MAX_COMPARE} موردين للمقارنة` : `Select up to ${MAX_COMPARE} suppliers to compare`}
              </p>
            </div>
          </div>

          {/* Selected suppliers header + add button */}
          <div className="flex flex-wrap gap-3 mb-6">
            {selectedIds.map((id) => {
              const s = allSuppliers.find((x: any) => x.id === id) as any;
              return (
                <Badge key={id} variant="secondary" className="gap-2 py-1.5 px-3 text-sm">
                  {s?.logo_url ? (
                    <img src={s.logo_url} className="h-4 w-4 rounded object-contain" alt="" />
                  ) : (
                    <Building2 className="h-3.5 w-3.5" />
                  )}
                  {isAr && s?.name_ar ? s.name_ar : s?.name || id.slice(0, 8)}
                  <button onClick={() => removeSupplier(id)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            {selectedIds.length < MAX_COMPARE && (
              <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => setShowPicker(!showPicker)}>
                <Plus className="h-3.5 w-3.5" />
                {isAr ? "إضافة مورد" : "Add Supplier"}
              </Button>
            )}
          </div>

          {/* Picker */}
          {showPicker && (
            <Card className="mb-6 rounded-xl">
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "ابحث عن مورد..." : "Search suppliers..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ps-9"
                    autoFocus
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-y-auto">
                  {filteredPicker.slice(0, 12).map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => addSupplier(s.id)}
                      className="flex items-center gap-3 rounded-lg border border-border/40 p-3 text-start hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {s.logo_url ? (
                          <img src={s.logo_url} className="h-5 w-5 object-contain" alt="" />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{isAr && s.name_ar ? s.name_ar : s.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.country_code && countryFlag(s.country_code)} {s.supplier_category || ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparison Table */}
          {orderedSuppliers.length >= 2 ? (
            <div className="overflow-x-auto rounded-xl border border-border/40">
              {/* Header row */}
              <div className="grid border-b-2 border-border/60" style={{ gridTemplateColumns: `200px repeat(${orderedSuppliers.length}, 1fr)` }}>
                <div className="p-4 bg-muted/30" />
                {orderedSuppliers.map((s: any) => (
                  <div key={s.id} className="p-4 text-center space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                      {s.logo_url ? (
                        <img src={s.logo_url} className="h-9 w-9 object-contain" alt={s.name} />
                      ) : (
                        <Building2 className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">{isAr && s.name_ar ? s.name_ar : s.name}</p>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(`/pro-suppliers/${s.id}`)}>
                      {isAr ? "عرض الملف" : "View Profile"}
                    </Button>
                  </div>
                ))}
              </div>

              <CompareRow
                label={isAr ? "الحالة" : "Status"}
                render={(s) => (
                  <SupplierBadges
                    isVerified={s.is_verified}
                    reviewCount={reviewStats[s.id]?.count || 0}
                    avgRating={reviewStats[s.id]?.avg || 0}
                    productCount={productCounts[s.id] || 0}
                    foundedYear={(s as any).founded_year}
                    variant="compact"
                  />
                )}
              />
              <CompareRow
                label={isAr ? "التصنيف" : "Category"}
                render={(s) => <Badge variant="secondary" className="text-[10px]">{(s as any).supplier_category || "—"}</Badge>}
              />
              <CompareRow
                label={isAr ? "الموقع" : "Location"}
                render={(s) => (
                  <span className="text-sm">
                    {s.country_code && countryFlag(s.country_code)} {s.city || s.country_code || "—"}
                  </span>
                )}
              />
              <CompareRow
                label={isAr ? "التقييم" : "Rating"}
                render={(s) => {
                  const stats = reviewStats[s.id];
                  return stats ? (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-chart-4 text-chart-4" />
                      {stats.avg.toFixed(1)} ({stats.count})
                    </span>
                  ) : <span className="text-muted-foreground">—</span>;
                }}
              />
              <CompareRow
                label={isAr ? "المنتجات" : "Products"}
                render={(s) => (
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    {productCounts[s.id] || 0}
                  </span>
                )}
              />
              <CompareRow
                label={isAr ? "سنة التأسيس" : "Founded"}
                render={(s) => <span>{(s as any).founded_year || "—"}</span>}
              />
              <CompareRow
                label={isAr ? "الهاتف" : "Phone"}
                render={(s) => s.phone ? (
                  <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                    <Phone className="h-3 w-3" />{s.phone}
                  </a>
                ) : <span className="text-muted-foreground">—</span>}
              />
              <CompareRow
                label={isAr ? "البريد" : "Email"}
                render={(s) => s.email ? (
                  <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-primary hover:underline text-xs">
                    <Mail className="h-3 w-3" />{s.email}
                  </a>
                ) : <span className="text-muted-foreground">—</span>}
              />
              <CompareRow
                label={isAr ? "الموقع الإلكتروني" : "Website"}
                render={(s) => s.website ? (
                  <a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-xs">
                    <Globe className="h-3 w-3" />{isAr ? "زيارة" : "Visit"}
                  </a>
                ) : <span className="text-muted-foreground">—</span>}
              />
              <CompareRow
                label={isAr ? "التخصصات" : "Specializations"}
                render={(s) => {
                  const specs = (s as any).specializations as string[] | null;
                  return specs?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {specs.map((sp) => (
                        <Badge key={sp} variant="outline" className="text-[9px]">{sp}</Badge>
                      ))}
                    </div>
                  ) : <span className="text-muted-foreground">—</span>;
                }}
              />
            </div>
          ) : (
            <div className="py-20 text-center">
              <Scale className="mx-auto mb-4 h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold">
                {isAr ? "اختر موردين على الأقل للمقارنة" : "Select at least 2 suppliers to compare"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAr ? "استخدم زر إضافة مورد أعلاه" : "Use the Add Supplier button above"}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
