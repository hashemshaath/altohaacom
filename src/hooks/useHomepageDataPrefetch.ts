import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Prefetches ALL homepage data in a single Promise.all batch.
 * Each result is seeded into React Query cache using the exact queryKey
 * that individual section components expect — so when they mount,
 * they find warm cache instead of firing new network requests.
 *
 * This reduces 40+ sequential Supabase calls to ~14 parallel calls.
 */
export function useHomepageDataPrefetch() {
  const qc = useQueryClient();
  const didPrefetch = useRef(false);

  useEffect(() => {
    if (didPrefetch.current) return;
    didPrefetch.current = true;

    const prefetch = async () => {
      try {
        const [
          competitions,
          exhibitions,
          articles,
          trendingArticles,
          masterclasses,
          testimonials,
          partnerLogos,
          companies,
          profiles,
          newUsers,
          chefRankings,
          stats,
        ] = await Promise.all([
          // 1. competitions — used by CompetitionsSection, RegionalEvents, SponsorshipOpportunities
          supabase
            .from("competitions")
            .select("id, title, title_ar, cover_image_url, status, competition_start, city, country, country_code, is_virtual, competition_sponsors(id, company_id)")
            .in("status", ["registration_open", "upcoming", "in_progress"])
            .order("competition_start", { ascending: true })
            .limit(20),

          // 2. exhibitions — used by CompetitionsSection
          supabase
            .from("exhibitions")
            .select("id, title, title_ar, cover_image_url, status, start_date, city, country, slug, venue, venue_ar")
            .in("status", ["upcoming", "active"])
            .order("start_date", { ascending: true })
            .limit(12),

          // 3. articles — used by ArticlesSection
          supabase
            .from("articles")
            .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, slug, published_at, type, view_count")
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(8),

          // 4. trending articles — used by HomeTrendingContent
          supabase
            .from("articles")
            .select("id, title, title_ar, slug, excerpt, excerpt_ar, featured_image_url, published_at, view_count, type")
            .eq("status", "published")
            .order("view_count", { ascending: false })
            .limit(8),

          // 5. masterclasses
          supabase
            .from("masterclasses")
            .select("id, title, title_ar, cover_image_url, category, level, price, currency, is_free, start_date, duration_hours, status")
            .in("status", ["published", "upcoming"])
            .order("start_date", { ascending: true, nullsFirst: false })
            .limit(8),

          // 6. testimonials
          supabase
            .from("testimonials")
            .select("id, name, name_ar, role, role_ar, quote, quote_ar, avatar_url, rating, sort_order")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .limit(10),

          // 7. partner_logos — used by StatsPartnersSection (sponsors + partners)
          supabase
            .from("partner_logos")
            .select("id, name, name_ar, logo_url, website_url, category, sort_order, is_active")
            .eq("is_active", true)
            .order("sort_order"),

          // 8. companies — used by HomeProSuppliers
          supabase
            .from("companies")
            .select("id, name, name_ar, logo_url, tagline, tagline_ar, city, country_code, is_verified, supplier_category, cover_image_url")
            .eq("status", "active")
            .eq("is_pro_supplier", true)
            .order("featured_order", { ascending: true, nullsFirst: false })
            .limit(8),

          // 9. profiles (featured chefs fallback - show all professional chefs)
          supabase
            .from("profiles")
            .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, city, specialization, specialization_ar, is_verified, loyalty_points, nationality, show_nationality, account_type")
            .in("account_type", ["professional"])
            .order("is_verified", { ascending: false })
            .order("loyalty_points", { ascending: false, nullsFirst: false })
            .limit(8),

          // 10. newly joined users
          supabase
            .from("profiles")
            .select("id, user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, city, specialization, specialization_ar, nationality, show_nationality, created_at")
            .order("created_at", { ascending: false })
            .limit(12),

          // 11. chef rankings
          supabase
            .from("chef_rankings")
            .select("user_id, total_points, gold_medals, silver_medals, bronze_medals, rank")
            .eq("ranking_period", "all_time")
            .order("total_points", { ascending: false })
            .limit(8),

          // 12. stats (counts)
          Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("competitions").select("id", { count: "exact", head: true }),
            supabase.from("culinary_entities").select("id", { count: "exact", head: true }),
            supabase.from("exhibitions").select("id", { count: "exact", head: true }),
          ]),
        ]);

        // Seed React Query cache with exact keys each component uses

        // CompetitionsSection
        if (competitions.data) {
          const compsSlice = competitions.data.slice(0, 6);
          qc.setQueryData(["home-competitions-minimal", 6], compsSlice);
        }

        // RegionalEvents
        if (competitions.data) {
          qc.setQueryData(["home-regional-comps"], competitions.data);
        }

        // SponsorshipOpportunities
        if (competitions.data) {
          qc.setQueryData(["home-sponsorship-opportunities"], competitions.data.map((c) => ({
            ...c,
            currentSponsors: c.competition_sponsors?.length || 0,
            packages: [], // packages fetched separately if needed
          })));
        }

        // Exhibitions
        if (exhibitions.data) {
          qc.setQueryData(["home-exhibitions-minimal"], exhibitions.data);
        }

        // Articles
        if (articles.data) {
          qc.setQueryData(["home-articles-minimal", 8], articles.data);
        }

        // Trending articles
        if (trendingArticles.data) {
          qc.setQueryData(["home-trending-articles", 8], trendingArticles.data);
        }

        // Masterclasses
        if (masterclasses.data) {
          qc.setQueryData(["home-masterclasses", 8], masterclasses.data);
        }

        // Testimonials
        if (testimonials.data) {
          qc.setQueryData(["home-testimonials", 10], testimonials.data);
        }

        // Partner logos — seed for both sponsors and partners sections
        if (partnerLogos.data) {
          const sponsorLogos = partnerLogos.data.filter((p) => p.category === "sponsor");
          const partnerOnlyLogos = partnerLogos.data.filter((p) => p.category !== "sponsor");
          qc.setQueryData(["section-logos", "sponsors", 12], sponsorLogos.length > 0 ? sponsorLogos.slice(0, 12).map((p) => ({
            id: p.id, name: p.name, logo_url: p.logo_url, website_url: p.website_url, category: p.category,
          })) : partnerLogos.data.slice(0, 12).map((p) => ({
            id: p.id, name: p.name, logo_url: p.logo_url, website_url: p.website_url, category: p.category,
          })));
          qc.setQueryData(["section-logos", "partners", 12], partnerOnlyLogos.length > 0 ? partnerOnlyLogos.slice(0, 12).map((p) => ({
            id: p.id, name: p.name, logo_url: p.logo_url, website_url: p.website_url, category: p.category,
          })) : partnerLogos.data.slice(0, 12).map((p) => ({
            id: p.id, name: p.name, logo_url: p.logo_url, website_url: p.website_url, category: p.category,
          })));
        }

        // Pro suppliers
        if (companies.data) {
          qc.setQueryData(["homeProSuppliers", 8], companies.data);
        }

        // Featured chefs — seed with rankings + profiles merged
        if (chefRankings.data && chefRankings.data.length > 0 && profiles.data) {
          const profileMap = new Map((profiles.data || []).map((p) => [p.user_id, p]));
          const merged = chefRankings.data.map((r) => ({ ...r, ...(profileMap.get(r.user_id) || {}) }));
          qc.setQueryData(["featured-chefs-home", 8], merged);
        } else if (profiles.data) {
          qc.setQueryData(["featured-chefs-home", 8], profiles.data.map((p) => ({
            ...p, total_points: p.loyalty_points || 0,
            gold_medals: 0, silver_medals: 0, bronze_medals: 0,
          })));
        }

        // Newly joined users
        if (newUsers.data) {
          qc.setQueryData(["newly-joined-users", 12], newUsers.data);
        }

        // Stats
        const getCount = (r) => r?.count ?? 0;
        qc.setQueryData(["home-stats"], {
          members: getCount(stats[0]),
          competitions: getCount(stats[1]),
          entities: getCount(stats[2]),
          exhibitions: getCount(stats[3]),
        });

      } catch (err) {
        // Non-blocking: individual sections will fetch their own data as fallback
        console.warn("[Homepage prefetch] Error:", err);
      }
    };

    prefetch();
  }, [qc]);
}
