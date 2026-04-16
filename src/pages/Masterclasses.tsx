import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap } from "lucide-react";
import { useAllCountries } from "@/hooks/useCountries";
import { MasterclassHero } from "@/components/masterclass/MasterclassHero";
import { MasterclassFilters } from "@/components/masterclass/MasterclassFilters";
import { MasterclassCard } from "@/components/masterclass/MasterclassCard";
import { CACHE } from "@/lib/queryConfig";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export default function Masterclasses() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const { data: allCountries = [] } = useAllCountries();

  const { data: masterclasses = [], isLoading } = useQuery({
    queryKey: ["masterclasses", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masterclasses")
        .select("*, masterclass_modules(id), masterclass_enrollments(id), masterclass_reviews(rating)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
    staleTime: CACHE.default.staleTime,
  });

  const { data: myEnrollments = [] } = useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("masterclass_enrollments")
        .select("masterclass_id")
        .eq("user_id", user.id)
        .eq("status", "active");
      if (error) throw handleSupabaseError(error);
      return data?.map((e) => e.masterclass_id) || [];
    },
    enabled: !!user,
    staleTime: CACHE.medium.staleTime,
  });

  const countryCodes = useMemo(() => Array.from(
    new Set(masterclasses.map((mc) => mc.country_code).filter(Boolean) as string[])
  ).sort(), [masterclasses]);

  const getCountryName = useCallback((code: string) => {
    const c = allCountries.find((ct) => ct.code === code);
    return c ? (isAr ? c.name_ar || c.name : c.name) : code;
  }, [allCountries, isAr]);

  const filtered = useMemo(() => masterclasses.filter((mc) => {
    const matchesSearch =
      !search ||
      mc.title?.toLowerCase().includes(search.toLowerCase()) ||
      mc.title_ar?.includes(search) ||
      mc.description?.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "all" || mc.level === levelFilter;
    const matchesCategory = categoryFilter === "all" || mc.category === categoryFilter;
    const matchesCountry = countryFilter === "all" || mc.country_code === countryFilter;
    return matchesSearch && matchesLevel && matchesCategory && matchesCountry;
  }), [masterclasses, search, levelFilter, categoryFilter, countryFilter]);

  const categories = useMemo(() => [...new Set(masterclasses.map((mc) => mc.category))], [masterclasses]);

  const totalEnrollments = useMemo(() => masterclasses.reduce(
    (sum, mc) => sum + (mc.masterclass_enrollments?.length || 0), 0
  ), [masterclasses]);

  return (
    <PageShell
      title={isAr ? "الدروس المتقدمة للطهاة" : "Culinary Masterclasses"}
      description={isAr ? "تعلم من أمهر الطهاة عبر دروس حصرية في فنون الطبخ والحلويات" : "Learn from world-class chefs through exclusive masterclasses in cuisine, pastry arts, and more"}
      seoProps={{
        keywords: isAr ? "دروس طهي, دورات طبخ, تعليم طهي, فنون الحلويات, دروس شيف" : "culinary masterclasses, cooking courses, chef training, pastry arts, culinary education",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: isAr ? "الدروس المتقدمة" : "Culinary Masterclasses",
          url: `${window.location.origin}/masterclasses`,
          isPartOf: { "@type": "WebSite", name: "Altoha", url: window.location.origin },
        },
      }}
      container={false}
      padding="none"
    >
      <MasterclassHero
        totalCount={masterclasses.length}
        filteredCount={filtered.length}
        totalEnrollments={totalEnrollments}
      />

      <div className="container flex-1 py-4 md:py-6">
        <MasterclassFilters
          search={search} onSearchChange={setSearch}
          levelFilter={levelFilter} onLevelChange={setLevelFilter}
          categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
          countryFilter={countryFilter} onCountryChange={setCountryFilter}
          categories={categories}
          countryCodes={countryCodes}
          getCountryName={getCountryName}
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="space-y-2.5 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-2xl bg-muted/60 p-5">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">
              {isAr ? "لا توجد دورات متاحة" : "No masterclasses found"}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {search
                ? (isAr ? "جرّب كلمات بحث مختلفة" : "Try different search terms")
                : (isAr ? "لا توجد دورات متاحة حالياً" : "No masterclasses available yet")}
            </p>
            {search && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                {isAr ? "مسح البحث" : "Clear search"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((mc) => (
              <MasterclassCard
                key={mc.id}
                mc={mc}
                isEnrolled={myEnrollments.includes(mc.id)}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
