import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSwipeTabs } from "@/hooks/useSwipeTabs";
import { isFuture, isPast } from "date-fns";
import { toast } from "sonner";

interface ExhibitionRow {
  [key: string]: any;
}

const countryFlag = (code?: string | null) => {
  if (!code || code.length !== 2) return null;
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1f1e6 - 65 + c.charCodeAt(0)));
};

export function useOrganizerDetailData() {
  const { name } = useParams<{ name: string }>();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const decodedName = decodeURIComponent(name || "");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [copied, setCopied] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("exhibitions");
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["organizer-detail", decodedName],
    queryFn: async () => {
      const ORG_FIELDS = "id, name, name_ar, slug, logo_url, cover_image_url, description, description_ar, email, phone, website, gallery_urls, key_contacts, total_views, is_verified, organizer_number, social_links, country, country_ar, country_code, city, city_ar, founded_year, status, follower_count, average_rating, total_exhibitions";
      const EX_FIELDS = "id, title, title_ar, slug, description, description_ar, type, status, start_date, end_date, venue, venue_ar, city, country, cover_image_url, logo_url, organizer_name, organizer_name_ar, organizer_logo_url, organizer_email, organizer_phone, organizer_website, view_count, tags, targeted_sectors, categories, includes_competitions, includes_training, includes_seminars, social_links, edition_stats, sponsors_info, is_virtual, is_featured, registration_url, website_url, edition_year, gallery_urls";

      const { data: orgRecord } = await supabase
        .from("organizers")
        .select(ORG_FIELDS)
        .eq("slug", decodedName)
        .maybeSingle();

      let exhibitions: any[] = [];
      if (orgRecord) {
        const [directRes, junctionRes] = await Promise.all([
          supabase
            .from("exhibitions")
            .select(EX_FIELDS)
            .or(`organizer_id.eq.${orgRecord.id},organizer_name.ilike.%${orgRecord.name}%`)
            .order("start_date", { ascending: false }),
          supabase
            .from("exhibition_organizers")
            .select("exhibition_id")
            .eq("organizer_id", orgRecord.id),
        ]);

        const directExhibitions = directRes.data || [];
        const junctionIds = (junctionRes.data || []).map((j) => j.exhibition_id);
        const directIds = new Set(directExhibitions.map((e) => e.id));
        const missingIds = junctionIds.filter((id: string) => !directIds.has(id));

        if (missingIds.length > 0) {
          const { data: extraExhibitions } = await supabase
            .from("exhibitions")
            .select(EX_FIELDS)
            .in("id", missingIds)
            .order("start_date", { ascending: false });
          exhibitions = [...directExhibitions, ...(extraExhibitions || [])];
        } else {
          exhibitions = directExhibitions;
        }
        exhibitions.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      } else {
        const { data: exByName } = await supabase
          .from("exhibitions")
          .select(EX_FIELDS)
          .eq("organizer_name", decodedName)
          .order("start_date", { ascending: false });
        exhibitions = exByName || [];
      }

      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, featured_image_url, published_at, type, status")
        .eq("status", "published")
        .or(`content.ilike.%${orgRecord?.name || decodedName}%,title.ilike.%${orgRecord?.name || decodedName}%`)
        .order("published_at", { ascending: false })
        .limit(10);

      let totalTickets = 0;
      let totalReviews = 0;
      if (exhibitions.length > 0) {
        const exIds = exhibitions.map(e => e.id);
        const [ticketRes, reviewRes] = await Promise.all([
          supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).in("exhibition_id", exIds),
          supabase.from("exhibition_reviews").select("id", { count: "exact", head: true }).in("exhibition_id", exIds),
        ]);
        totalTickets = ticketRes.count || 0;
        totalReviews = reviewRes.count || 0;
      }

      return { orgRecord, exhibitions, articles: articles || [], totalTickets, totalReviews };
    },
    enabled: !!decodedName,
    staleTime: 1000 * 60 * 5,
  });

  // Increment views
  useEffect(() => {
    if (data?.orgRecord?.id) {
      supabase.rpc("increment_organizer_views", { p_organizer_id: data.orgRecord.id }).then(null, () => {});
    }
  }, [data?.orgRecord?.id]);

  const exhibitions = data?.exhibitions || [];
  const articles = data?.articles || [];
  const orgRecord = data?.orgRecord;
  const org = orgRecord || exhibitions[0] || null;
  const useOrgRecord = !!orgRecord;

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: org?.name || "", url });
    } else {
      navigator.clipboard.writeText(url).then(null, () => {});
      setCopied(true);
      toast.success(isAr ? "تم نسخ الرابط" : "Link copied");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [org, isAr]);

  const handleFollow = useCallback(() => {
    if (!user) { toast.error(isAr ? "يرجى تسجيل الدخول" : "Please log in first"); return; }
    setIsFollowing(prev => !prev);
    toast.success(isFollowing ? (isAr ? "تم إلغاء المتابعة" : "Unfollowed") : (isAr ? "تمت المتابعة" : "Following!"));
  }, [user, isAr, isFollowing]);

  const computed = useMemo(() => {
    if (!exhibitions.length && !orgRecord) return null;

    const orgName = useOrgRecord
      ? (isAr && org?.name_ar ? org.name_ar : org?.name || decodedName)
      : (isAr && org?.organizer_name_ar ? org.organizer_name_ar : org?.organizer_name || decodedName);
    const orgNameSecondary = useOrgRecord
      ? (isAr ? org?.name : org?.name_ar)
      : (isAr ? org?.organizer_name : org?.organizer_name_ar);
    const orgLogo = useOrgRecord ? org?.logo_url : (org?.organizer_logo_url || org?.logo_url);
    const orgDescription = useOrgRecord ? (isAr && org?.description_ar ? org.description_ar : org?.description) : null;
    const orgGallery: string[] = useOrgRecord ? (org?.gallery_urls || []) : [];
    const orgKeyContacts: any[] = useOrgRecord ? (org?.key_contacts || []) : [];
    const totalExhibitions = exhibitions.length;
    const totalViews = useOrgRecord && org?.total_views ? org.total_views : exhibitions.reduce((s: number, e: ExhibitionRow) => s + (e.view_count || 0), 0);
    const countries = [...new Set(exhibitions.map((e: ExhibitionRow) => e.country).filter(Boolean))] as string[];
    const cities = [...new Set(exhibitions.map((e: ExhibitionRow) => e.city).filter(Boolean))] as string[];
    const types = [...new Set(exhibitions.map((e: ExhibitionRow) => e.type))] as string[];
    const venues = [...new Set(exhibitions.map((e: ExhibitionRow) => isAr && e.venue_ar ? e.venue_ar : e.venue).filter(Boolean))] as string[];
    const coverImage = useOrgRecord ? org?.cover_image_url : exhibitions.find((e: ExhibitionRow) => e.cover_image_url)?.cover_image_url;

    const allGalleryImages: string[] = [...orgGallery];
    exhibitions.forEach((e: ExhibitionRow) => {
      if (e.cover_image_url) allGalleryImages.push(e.cover_image_url);
      if (e.gallery_urls && Array.isArray(e.gallery_urls)) allGalleryImages.push(...e.gallery_urls);
    });
    const uniqueGallery = [...new Set(allGalleryImages)];

    const allSectors = new Set<string>();
    const allCategories = new Set<string>();
    const allTags = new Set<string>();
    exhibitions.forEach((e: ExhibitionRow) => {
      (e.targeted_sectors || []).forEach((s: string) => allSectors.add(s));
      (e.categories || []).forEach((c: string) => allCategories.add(c));
      (e.tags || []).forEach((t: string) => allTags.add(t));
    });

    const services = {
      competitions: exhibitions.some((e: ExhibitionRow) => e.includes_competitions),
      training: exhibitions.some((e: ExhibitionRow) => e.includes_training),
      seminars: exhibitions.some((e: ExhibitionRow) => e.includes_seminars),
    };

    const rawSocial = orgRecord?.social_links || exhibitions.find((e: ExhibitionRow) => e.social_links)?.social_links;
    const socialLinks: Record<string, string> = (rawSocial && typeof rawSocial === 'object' && !Array.isArray(rawSocial))
      ? rawSocial as Record<string, string> : {};

    const byYear: Record<string, ExhibitionRow[]> = {};
    exhibitions.forEach((e: ExhibitionRow) => {
      const year = new Date(e.start_date).getFullYear().toString();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(e);
    });
    const sortedYears = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

    const upcoming = exhibitions.filter((e: ExhibitionRow) => e.start_date && isFuture(new Date(e.start_date)));
    const past = exhibitions.filter((e: ExhibitionRow) => e.end_date && isPast(new Date(e.end_date)));
    const active = exhibitions.filter((e: ExhibitionRow) => {
      if (!e.start_date || !e.end_date) return false;
      const now = new Date();
      return now >= new Date(e.start_date) && now <= new Date(e.end_date);
    });

    const years = exhibitions.map((e: ExhibitionRow) => new Date(e.start_date).getFullYear()).filter(Boolean);
    const firstYear = Math.min(...years);
    const lastYear = Math.max(...years);

    const editionStats: { exhibitors?: number; visitors?: number; area?: number } = {};
    exhibitions.forEach((e: ExhibitionRow) => {
      if (e.edition_stats) {
        const stats = typeof e.edition_stats === 'string' ? JSON.parse(e.edition_stats) : e.edition_stats;
        if (stats.exhibitors) editionStats.exhibitors = (editionStats.exhibitors || 0) + Number(stats.exhibitors);
        if (stats.visitors) editionStats.visitors = (editionStats.visitors || 0) + Number(stats.visitors);
        if (stats.area) editionStats.area = Math.max(editionStats.area || 0, Number(stats.area));
      }
    });

    const allSponsors: { name: string; logo?: string; tier?: string }[] = [];
    exhibitions.forEach((e: ExhibitionRow) => {
      if (e.sponsors_info && Array.isArray(e.sponsors_info)) {
        e.sponsors_info.forEach((s: any) => {
          if (s.name && !allSponsors.some(sp => sp.name === s.name)) {
            allSponsors.push({ name: s.name, logo: s.logo_url || s.logo, tier: s.tier });
          }
        });
      }
    });

    const nextEvent = upcoming.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];

    return {
      orgName, orgNameSecondary, orgLogo, coverImage, totalExhibitions, totalViews,
      countries, cities, types, venues, services, socialLinks,
      byYear, sortedYears, upcoming, past, active,
      firstYear, lastYear, allSectors, allCategories, allTags,
      editionStats, allSponsors, nextEvent,
      orgDescription, orgGallery, orgKeyContacts, uniqueGallery,
    };
  }, [exhibitions, isAr, org, decodedName, useOrgRecord, orgRecord]);

  const availableTabs = useMemo(() => [
    "exhibitions",
    ...(computed?.upcoming?.length ? ["upcoming"] : []),
    "gallery",
    "profile",
    "stats",
    ...(computed?.orgKeyContacts?.length ? ["team"] : []),
    ...(computed?.allSponsors?.length ? ["partners"] : []),
    ...(articles.length > 0 ? ["news"] : []),
  ], [computed?.allSponsors?.length, articles.length, computed?.upcoming?.length, computed?.orgKeyContacts?.length]);

  const { swipeHandlers } = useSwipeTabs({ tabs: availableTabs, currentTab: activeTab, onTabChange: setActiveTab });

  const contactEmail = orgRecord?.email || org?.organizer_email;
  const contactPhone = orgRecord?.phone || org?.organizer_phone;
  const contactWebsite = orgRecord?.website || org?.organizer_website;
  const flag = countryFlag(orgRecord?.country_code);

  return {
    isAr, isLoading, org, orgRecord, computed, exhibitions, articles, data,
    viewMode, setViewMode, copied, galleryOpen, setGalleryOpen,
    galleryIndex, setGalleryIndex, isFollowing, activeTab, setActiveTab,
    handleShare, handleFollow, swipeHandlers,
    contactEmail, contactPhone, contactWebsite, flag, decodedName, user,
  };
}
