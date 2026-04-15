import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/lib/queryConfig";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export interface AuthHeroSlide {
  id: string;
  title: string | null;
  title_ar: string | null;
  subtitle: string | null;
  subtitle_ar: string | null;
  image_url: string;
  page_type: string;
  sort_order: number;
  is_active: boolean;
}

export function useAuthHeroSlides(pageType: "individual" | "company" = "individual") {
  return useQuery({
    queryKey: ["auth-hero-slides", pageType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auth_hero_slides")
        .select("id, title, title_ar, subtitle, subtitle_ar, image_url, page_type, sort_order, is_active")
        .eq("is_active", true)
        .in("page_type", [pageType, "both"])
        .order("sort_order", { ascending: true });
      if (error) throw handleSupabaseError(error);
      return (data || []) as AuthHeroSlide[];
    },
    ...CACHE.long,
  });
}
