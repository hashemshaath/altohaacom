/**
 * Custom hook that centralises all data-fetching for CompetitionDetail.
 */
import { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useEventWatchlist } from "@/components/fan/FanEventWatchlist";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { CACHE } from "@/lib/queryConfig";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export function useCompetitionDetailData() {
  const { slug: urlParam } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const isAr = language === "ar";
  const slug = urlParam;

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", slug],
    queryFn: async () => {
      let { data, error } = await supabase.from("competitions").select("id, title, title_ar, description, description_ar, cover_image_url, rules_summary, rules_summary_ar, scoring_notes, scoring_notes_ar, registration_start, registration_end, competition_start, competition_end, is_virtual, venue, venue_ar, city, country, country_code, edition_year, max_participants, exhibition_id, organizer_id, competition_number, status, registration_fee_type, registration_fee, registration_currency, registration_tax_rate, registration_tax_name, registration_tax_name_ar, allowed_entry_types, max_team_size, min_team_size, series_id, created_at, blind_judging_enabled, blind_code_prefix, slug").eq("slug", slug).maybeSingle();
      if (!data) {
        ({ data, error } = await supabase.from("competitions").select("id, title, title_ar, description, description_ar, cover_image_url, rules_summary, rules_summary_ar, scoring_notes, scoring_notes_ar, registration_start, registration_end, competition_start, competition_end, is_virtual, venue, venue_ar, city, country, country_code, edition_year, max_participants, exhibition_id, organizer_id, competition_number, status, registration_fee_type, registration_fee, registration_currency, registration_tax_rate, registration_tax_name, registration_tax_name_ar, allowed_entry_types, max_team_size, min_team_size, series_id, created_at, blind_judging_enabled, blind_code_prefix, slug").eq("id", slug).maybeSingle());
      }
      if (error) throw handleSupabaseError(error);
      if (!data) throw new Error("Competition not found");
      return data;
    },
    enabled: !!slug,
    staleTime: CACHE.default.staleTime,
  });

  // SEO: Redirect UUID URLs to slug-based canonical URL
  const isUuidParam = urlParam && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(urlParam);
  useEffect(() => {
    if (competition?.slug && isUuidParam && competition.slug !== urlParam) {
      navigate(`/competitions/${competition.slug}`, { replace: true });
    }
  }, [competition?.slug, isUuidParam, urlParam, navigate]);

  const competitionId = competition?.id;
  const { data: qrCode } = useEntityQRCode("competition", competitionId, "competition");
  const { isWatched, toggle: toggleWatchlist } = useEventWatchlist("competition", competitionId);

  const { data: categories } = useQuery({
    queryKey: ["competition-categories", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_categories").select("id, name, name_ar, description, description_ar, max_participants, gender, sort_order, cover_image_url, participant_level, status").eq("competition_id", competitionId!).order("sort_order");
      if (error) throw handleSupabaseError(error);
      return data;
    },
    enabled: !!competitionId,
    staleTime: CACHE.medium.staleTime,
  });

  const { data: criteria } = useQuery({
    queryKey: ["judging-criteria", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase.from("judging_criteria").select("id, name, name_ar, description, description_ar, max_score, weight, sort_order").eq("competition_id", competitionId!).order("sort_order");
      if (error) throw handleSupabaseError(error);
      return data;
    },
    enabled: !!competitionId,
    staleTime: CACHE.medium.staleTime,
  });

  const { data: myRegistration } = useQuery({
    queryKey: ["my-registration", competitionId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("competition_registrations").select("id, status, competition_id, participant_id, category_id, dish_name, entry_type, team_name, registered_at").eq("competition_id", competitionId!).eq("participant_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!competitionId && !!user,
  });

  const { data: registrationStats } = useQuery({
    queryKey: ["registration-stats", competitionId],
    queryFn: async () => {
      const { data } = await supabase.from("competition_registrations").select("status").eq("competition_id", competitionId!);
      const total = data?.length || 0;
      const approved = data?.filter(r => r.status === "approved").length || 0;
      const pending = data?.filter(r => r.status === "pending").length || 0;
      return { total, approved, pending };
    },
    enabled: !!competitionId,
    staleTime: CACHE.short.staleTime,
  });

  const { data: judgesCount } = useQuery({
    queryKey: ["judges-count", competitionId],
    queryFn: async () => {
      const { data } = await supabase.from("competition_judges").select("id").eq("competition_id", competitionId!);
      return data?.length || 0;
    },
    enabled: !!competitionId,
    staleTime: CACHE.medium.staleTime,
  });

  const { data: competitionTypes } = useQuery({
    queryKey: ["competition-detail-types", competitionId],
    queryFn: async () => {
      const { data: assignments } = await supabase.from("competition_type_assignments").select("type_id").eq("competition_id", competitionId!);
      if (!assignments || assignments.length === 0) return [];
      const typeIds = assignments.map((a) => a.type_id);
      const { data: types } = await supabase.from("competition_types").select("id, name, name_ar, icon, cover_image_url").in("id", typeIds);
      return types || [];
    },
    enabled: !!competitionId,
  });

  const { data: supervisingBodies } = useQuery({
    queryKey: ["competition-detail-bodies", competitionId],
    queryFn: async () => {
      const { data: assignments } = await supabase.from("competition_supervising_bodies").select("entity_id, role").eq("competition_id", competitionId!);
      if (!assignments || assignments.length === 0) return [];
      const entityIds = assignments.map((a) => a.entity_id);
      const roles = new Map(assignments.map(a => [a.entity_id, a.role]));
      const { data: entities } = await supabase.from("culinary_entities").select("id, name, name_ar, abbreviation, logo_url, type, country").in("id", entityIds);
      return (entities || []).map(e => ({ ...e, bodyRole: roles.get(e.id) || "supervisor" }));
    },
    enabled: !!competitionId,
  });

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return data?.map(r => r.role) || [];
    },
    enabled: !!user,
  });

  const supervisors = useMemo(() => supervisingBodies?.filter(b => b.bodyRole === "supervisor") || [], [supervisingBodies]);
  const accreditors = useMemo(() => supervisingBodies?.filter(b => b.bodyRole !== "supervisor") || [], [supervisingBodies]);

  const isOrganizer = user && competition?.organizer_id === user.id;
  const canSeeKnowledge = isOrganizer || isAdmin || userRoles?.some(r => ["judge", "supervisor"].includes(r));

  const totalScore = useMemo(() => criteria?.reduce((sum, c) => sum + (c.max_score || 0), 0) || 0, [criteria]);
  const completionPercent = useMemo(() => {
    if (!competition) return 0;
    const start = new Date(competition.competition_start).getTime();
    const end = new Date(competition.competition_end).getTime();
    const now = Date.now();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }, [competition]);

  return {
    competition, isLoading, competitionId, slug, urlParam,
    isAr, language, t, user, isAdmin,
    qrCode, isWatched, toggleWatchlist,
    categories, criteria, myRegistration, registrationStats, judgesCount,
    competitionTypes, supervisingBodies, supervisors, accreditors,
    userRoles, isOrganizer, canSeeKnowledge,
    totalScore, completionPercent,
  };
}
