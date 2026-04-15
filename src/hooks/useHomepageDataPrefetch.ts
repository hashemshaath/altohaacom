import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { canPrefetch } from "./useConnectionAwarePrefetch";

/**
 * Prefetches ALL homepage data using Promise.allSettled for resilient parallel loading.
 * Each result is seeded into React Query cache using the exact queryKey
 * that individual section components expect — so when they mount,
 * they find warm cache instead of firing new network requests.
 *
 * Uses Promise.allSettled instead of Promise.all to prevent one failed
 * query from blocking all other prefetches.
 */
export function useHomepageDataPrefetch() {
  const qc = useQueryClient();
  const didPrefetch = useRef(false);

  useEffect(() => {
    if (didPrefetch.current) return;
    didPrefetch.current = true;

    let cancelled = false;

    // Skip heavy prefetching on slow/metered connections
    if (!canPrefetch()) return;

    const prefetch = async () => {
      const results = await Promise.allSettled([
        // 0. competitions
        supabase
          .from("competitions")
          .select("id, title, title_ar, cover_image_url, status, competition_start, city, country, country_code, is_virtual, competition_sponsors(id, company_id)")
          .in("status", ["registration_open", "upcoming", "in_progress"])
          .order("competition_start", { ascending: true })
          .limit(20),

        // 1. exhibitions
        supabase
          .from("exhibitions")
          .select("id, title, title_ar, cover_image_url, status, start_date, city, country, slug, venue, venue_ar")
          .in("status", ["upcoming", "active", "completed"])
          .order("start_date", { ascending: true })
          .limit(20),

        // 2. articles
        supabase
          .from("articles")
          .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type, view_count")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(8),

        // 3. trending articles
        supabase
          .from("articles")
          .select("id, title, title_ar, slug, excerpt, excerpt_ar, featured_image_url, published_at, view_count, type")
          .eq("status", "published")
          .order("view_count", { ascending: false })
          .limit(8),

        // 4. masterclasses
        supabase
          .from("masterclasses")
          .select("id, title, title_ar, cover_image_url, category, level, price, currency, is_free, start_date, duration_hours, status")
          .in("status", ["published", "upcoming"])
          .order("start_date", { ascending: true, nullsFirst: false })
          .limit(8),

        // 5. testimonials
        supabase
          .from("testimonials")
          .select("id, name, name_ar, role, role_ar, quote, quote_ar, avatar_url, rating, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(10),

        // 6. partner_logos
        supabase
          .from("partner_logos")
          .select("id, name, name_ar, logo_url, website_url, category, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order"),

        // 7. companies (pro suppliers)
        supabase
          .from("companies")
          .select("id, name, name_ar, logo_url, tagline, tagline_ar, city, country_code, is_verified, supplier_category, cover_image_url")
          .eq("status", "active")
          .eq("is_pro_supplier", true)
          .order("featured_order", { ascending: true, nullsFirst: false })
          .limit(8),

        // 8. profiles (featured chefs)
        supabase
          .from("profiles")
          .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, city, specialization, specialization_ar, is_verified, loyalty_points, nationality, show_nationality, account_type")
          .in("account_type", ["professional"])
          .order("is_verified", { ascending: false })
          .order("loyalty_points", { ascending: false, nullsFirst: false })
          .limit(8),

        // 9. newly joined users
        supabase
          .from("profiles")
          .select("id, user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, city, specialization, specialization_ar, nationality, show_nationality, created_at")
          .order("created_at", { ascending: false })
          .limit(12),

        // 10. chef rankings
        supabase
          .from("chef_rankings")
          .select("user_id, total_points, gold_medals, silver_medals, bronze_medals, rank")
          .eq("ranking_period", "all_time")
          .order("total_points", { ascending: false })
          .limit(8),

        // 11. stats (counts)
        Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("competitions").select("id", { count: "exact", head: true }),
          supabase.from("culinary_entities").select("id", { count: "exact", head: true }),
          supabase.from("exhibitions").select("id", { count: "exact", head: true }),
          supabase.from("organizers").select("id", { count: "exact", head: true }),
        ]),
      ]);

      if (cancelled) return;

      // Helper to safely extract data from settled results
      const getData = <T,>(index: number): T | null => {
        const r = results[index];
        if (r.status !== "fulfilled") return null;
        const val = r.value as { data?: T };
        return val?.data ?? null;
      };

      // Set updatedAt so staleTime works correctly with prefetched data
      const now = Date.now();

      // Seed helper – sets data with proper updatedAt timestamp
      const seed = (key: unknown[], data: unknown) =>
        qc.setQueryData(key, data, { updatedAt: now });

      // 0. Competitions
      const compsData = getData<Record<string, unknown>[]>(0);
      if (compsData) {
        seed(["home-competitions-minimal", 6], compsData.slice(0, 6));
        seed(["home-regional-comps"], compsData);
        seed(["home-sponsorship-opportunities"], compsData.map((c) => ({
          ...c,
          currentSponsors: c.competition_sponsors?.length || 0,
          packages: [],
        })));
      }

      // 1. Exhibitions
      const exhData = getData<Record<string, unknown>[]>(1);
      if (exhData) {
        const active = exhData.filter(e => e.status !== "completed");
        const completed = exhData.filter(e => e.status === "completed").reverse().slice(0, 4);
        seed(["home-exhibitions-minimal"], [...active, ...completed].slice(0, 12));
      }

      // 2. Articles
      const artData = getData<Record<string, unknown>[]>(2);
      if (artData) seed(["home-articles-minimal", 8], artData);

      // 3. Trending articles
      const trendData = getData<Record<string, unknown>[]>(3);
      if (trendData) seed(["home-trending-articles", 8], trendData);

      // 4. Masterclasses
      const mcData = getData<Record<string, unknown>[]>(4);
      if (mcData) seed(["home-masterclasses", 8], mcData);

      // 5. Testimonials
      const testData = getData<Record<string, unknown>[]>(5);
      if (testData) seed(["home-testimonials", 10], testData);

      // 6. Partner logos
      const logoData = getData<Record<string, unknown>[]>(6);
      if (logoData) {
        const sponsorLogos = logoData.filter((p) => p.category === "sponsor");
        const partnerOnlyLogos = logoData.filter((p) => p.category !== "sponsor");
        const mapLogo = (p: Record<string, unknown>) => ({ id: p.id, name: p.name, logo_url: p.logo_url, website_url: p.website_url, category: p.category });
        seed(["section-logos", "sponsors", 12],
          (sponsorLogos.length > 0 ? sponsorLogos : logoData).slice(0, 12).map(mapLogo));
        seed(["section-logos", "partners", 12],
          (partnerOnlyLogos.length > 0 ? partnerOnlyLogos : logoData).slice(0, 12).map(mapLogo));
      }

      // 7. Pro suppliers
      const suppData = getData<Record<string, unknown>[]>(7);
      if (suppData) seed(["homeProSuppliers", 8], suppData);

      // 8 & 10. Featured chefs (merged with rankings)
      const profilesData = getData<Record<string, unknown>[]>(8);
      const rankingsData = getData<Record<string, unknown>[]>(10);
      if (rankingsData && rankingsData.length > 0 && profilesData) {
        const profileMap = new Map(profilesData.map((p) => [p.user_id, p]));
        const merged = rankingsData.map((r) => ({ ...r, ...(profileMap.get(r.user_id) || {}) }));
        seed(["featured-chefs-home", 8], merged);
      } else if (profilesData) {
        seed(["featured-chefs-home", 8], profilesData.map((p) => ({
          ...p, total_points: p.loyalty_points || 0,
          gold_medals: 0, silver_medals: 0, bronze_medals: 0,
        })));
      }

      // 9. Newly joined users
      const newUsersData = getData<Record<string, unknown>[]>(9);
      if (newUsersData) seed(["newly-joined-users", 12], newUsersData);

      // 11. Stats
      const statsResult = results[11];
      if (statsResult.status === "fulfilled") {
        const statsArr = statsResult.value as { count: number | null }[];
        const getCount = (r: { count: number | null }) => r?.count ?? 0;
        seed(["home-stats"], {
          members: getCount(statsArr[0]),
          competitions: getCount(statsArr[1]),
          entities: getCount(statsArr[2]),
          exhibitions: getCount(statsArr[3]),
          organizers: getCount(statsArr[4]),
        });
      }
    };

    prefetch().then(null, () => {});

    return () => { cancelled = true; };
  }, [qc]);
}
