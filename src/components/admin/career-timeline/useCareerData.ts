import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SectionConfig, CareerRecord } from "./constants";
import { DEFAULT_SECTIONS, CUSTOM_SECTION_COLORS } from "./constants";

export function useCareerData(userId: string) {
  // ── Load sections ──
  const { data: dbSections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["user-career-sections", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_career_sections").select("*")
        .eq("user_id", userId).order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const sections: SectionConfig[] = useMemo(() => {
    const customFromDb: SectionConfig[] = dbSections
      .filter((s: any) => s.is_custom)
      .map((s: any) => ({
        key: s.section_key, icon: s.icon || "FileText",
        en: s.name_en, ar: s.name_ar || s.name_en,
        color: s.color || CUSTOM_SECTION_COLORS[0], isCustom: true,
      }));
    const dbDefaultOrder = dbSections
      .filter((s: any) => !s.is_custom)
      .reduce((acc: Record<string, any>, s: any) => { acc[s.section_key] = s; return acc; }, {} as Record<string, any>);
    const defaults = DEFAULT_SECTIONS.map(d => {
      const override = dbDefaultOrder[d.key];
      if (override) return { ...d, icon: override.icon || d.icon, en: override.name_en || d.en, ar: override.name_ar || d.ar };
      return d;
    });
    if (dbSections.length > 0) {
      const orderedKeys = dbSections.map((s: any) => s.section_key);
      const allSections = [...defaults, ...customFromDb];
      const ordered: SectionConfig[] = [];
      for (const key of orderedKeys) {
        const found = allSections.find(s => s.key === key);
        if (found) ordered.push(found);
      }
      for (const d of defaults) {
        if (!ordered.find(s => s.key === d.key)) ordered.push(d);
      }
      return ordered;
    }
    return [...defaults, ...customFromDb];
  }, [dbSections]);

  // ── Data Queries ──
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["career-records", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_career_records").select("*")
        .eq("user_id", userId).order("sort_order", { ascending: true })
        .order("is_current", { ascending: false })
        .order("end_date", { ascending: false, nullsFirst: true }).order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []) as CareerRecord[];
    },
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["user-entity-memberships", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_memberships")
        .select("*, culinary_entities(name, name_ar, logo_url, type)")
        .eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ["user-competition-history", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_registrations")
        .select("id, registered_at, status, competitions(title, title_ar, competition_start, country_code, status)")
        .eq("participant_id", userId).order("registered_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["user-certificates-awards", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificates")
        .select("id, issued_at, event_name, event_name_ar, achievement, achievement_ar, type, status, verification_code")
        .eq("recipient_id", userId).eq("status", "issued").order("issued_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // ── Memoized helpers ──
  const getRecordsForSection = useCallback((key: string) => records.filter(r => r.record_type === key), [records]);
  const competitionCareerRecords = useMemo(() => records.filter(r => r.record_type === "competitions"), [records]);

  const getSectionCount = useCallback((key: string): number => {
    if (key === "memberships") return memberships.length;
    if (key === "competitions") return competitions.length + competitionCareerRecords.length;
    if (key === "awards") return certificates.length;
    return getRecordsForSection(key).length;
  }, [memberships, competitions, competitionCareerRecords, certificates, getRecordsForSection]);

  const getSectionItemIds = useCallback((key: string): string[] => {
    const draggableKeys = ["education", "work", "competitions", "judging", "media", "organizing"];
    if (draggableKeys.includes(key) || sections.find(s => s.isCustom && s.key === key)) return getRecordsForSection(key).map(r => r.id);
    return [];
  }, [sections, getRecordsForSection]);

  const sectionIds = useMemo(() => sections.map(s => s.key), [sections]);

  const isLoading = sectionsLoading || recordsLoading;

  return {
    dbSections, sections, records, memberships, competitions, certificates,
    competitionCareerRecords, getRecordsForSection, getSectionCount,
    getSectionItemIds, sectionIds, isLoading,
  };
}
