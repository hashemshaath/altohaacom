import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomepageSection {
  id: string;
  section_key: string;
  section_number: string | null;
  classification: string | null;
  component_name: string | null;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  description_en: string;
  description_ar: string;
  is_visible: boolean;
  sort_order: number;
  cover_type: "none" | "background" | "banner";
  cover_image_url: string;
  cover_height: number;
  cover_overlay_opacity: number;
  item_count: number;
  item_size: "small" | "medium" | "large";
  items_per_row: number;
  max_items_mobile: number;
  show_filters: boolean;
  show_view_all: boolean;
  show_title: boolean;
  show_subtitle: boolean;
  show_description: boolean;
  spacing: "none" | "compact" | "normal" | "relaxed";
  animation: "none" | "fade" | "slide-up" | "slide-left" | "scale" | "blur";
  bg_color: string;
  css_class: string;
  container_width: "default" | "narrow" | "wide" | "full";
  source_type: "auto" | "manual" | "query";
  source_table: string;
  source_filters: Record<string, any>;
  source_sort_by: string;
  source_sort_dir: "asc" | "desc";
  display_style: "grid" | "carousel" | "list" | "masonry" | "featured";
  card_template: "default" | "minimal" | "overlay" | "horizontal" | "stats";
  custom_config: Record<string, any>;
  updated_at: string;
}

const QUERY_KEY = ["homepage-sections"];

export function useHomepageSections() {
  return useQuery<HomepageSection[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("id, section_key, section_number, title_en, title_ar, subtitle_en, subtitle_ar, is_visible, sort_order, config, badge_en, badge_ar, updated_at")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as HomepageSection[];
    },
    staleTime: 1000 * 60 * 5, // 5 min – admin can force-refresh from manager
    refetchOnWindowFocus: false,
  });
}

export function useHomepageSection(sectionKey: string) {
  const { data: sections } = useHomepageSections();
  return sections?.find((s) => s.section_key === sectionKey) ?? null;
}

export function useUpdateHomepageSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HomepageSection> & { id: string }) => {
      const { error } = await supabase
        .from("homepage_sections")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useBulkUpdateHomepageSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sections: (Partial<HomepageSection> & { id: string })[]) => {
      for (const { id, ...updates } of sections) {
        const { error } = await supabase
          .from("homepage_sections")
          .update(updates as any)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useCreateHomepageSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (section: Omit<HomepageSection, "id" | "updated_at">) => {
      const { error } = await supabase
        .from("homepage_sections")
        .insert(section as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
