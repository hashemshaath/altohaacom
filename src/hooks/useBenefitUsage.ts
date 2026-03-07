import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BenefitUsage {
  benefitCode: string;
  benefitName: string;
  benefitNameAr: string | null;
  iconName: string;
  category: string;
  monthlyLimit: number | null; // null = unlimited
  currentUsage: number;
  percentUsed: number;
  sortOrder: number;
}

export function useBenefitUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["benefit-usage", user?.id],
    queryFn: async (): Promise<BenefitUsage[]> => {
      if (!user) return [];

      // Get user's tier
      const { data: profile } = await supabase
        .from("profiles")
        .select("membership_tier")
        .eq("user_id", user.id)
        .single();

      const tier = profile?.membership_tier || "basic";

      // Get limits for this tier
      const { data: limits } = await supabase
        .from("membership_benefit_limits")
        .select("id, benefit_code, benefit_name, benefit_name_ar, icon_name, category, monthly_limit, sort_order, is_active")
        .eq("tier", tier)
        .eq("is_active", true)
        .order("sort_order");

      if (!limits || limits.length === 0) return [];

      // Get current month boundaries
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // Query actual usage counts in parallel
      const countQuery = async (table: string, userCol: string, dateCol: string, extraFilters?: Record<string, string>) => {
        let q = supabase.from(table as any).select("id", { count: "exact", head: true }).eq(userCol, user.id);
        if (dateCol) {
          q = q.gte(dateCol, monthStart).lte(dateCol, monthEnd);
        }
        if (extraFilters) {
          for (const [k, v] of Object.entries(extraFilters)) {
            q = q.eq(k, v);
          }
        }
        const { count } = await q;
        return count || 0;
      };

      const [posts, stories, recipes, messages, comps, live, links] = await Promise.all([
        countQuery("posts", "author_id", "created_at"),
        countQuery("community_stories", "user_id", "created_at"),
        countQuery("posts", "author_id", "created_at", { type: "recipe" }),
        countQuery("chat_session_messages", "sender_id", "created_at"),
        countQuery("competition_registrations", "participant_id", "registered_at"),
        countQuery("live_sessions", "host_id", "created_at"),
        countQuery("social_link_pages", "user_id", ""),
      ]);

      const usageMap: Record<string, number> = {
        posts,
        stories,
        recipes,
        messages,
        competitions: comps,
        live_sessions: live,
        social_links: links,
      };

      return limits.map((limit) => {
        const usage = usageMap[limit.benefit_code] || 0;
        const percent = limit.monthly_limit ? Math.min(100, Math.round((usage / limit.monthly_limit) * 100)) : 0;
        return {
          benefitCode: limit.benefit_code,
          benefitName: limit.benefit_name,
          benefitNameAr: limit.benefit_name_ar,
          iconName: limit.icon_name || "Zap",
          category: limit.category,
          monthlyLimit: limit.monthly_limit,
          currentUsage: usage,
          percentUsed: percent,
          sortOrder: limit.sort_order || 0,
        };
      });
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
