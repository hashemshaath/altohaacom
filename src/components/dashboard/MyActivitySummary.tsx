import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, MessageSquare, Heart, BookOpen } from "lucide-react";
import { formatNumber } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const MyActivitySummary = memo(function MyActivitySummary() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["my-activity-summary", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const posts = await (supabase.from("posts").select("id", { count: "exact", head: true }) as any).eq("author_id", user.id);
      const likes = await (supabase.from("post_likes").select("id", { count: "exact", head: true }) as any).eq("user_id", user.id);
      const competitions = await (supabase.from("competition_registrations").select("id", { count: "exact", head: true }) as any).eq("user_id", user.id);
      const recipes = await (supabase.from("recipes").select("id", { count: "exact", head: true }) as any).eq("author_id", user.id);
      return {
        posts: (posts as any).count ?? 0,
        likes: (likes as any).count ?? 0,
        competitions: (competitions as any).count ?? 0,
        recipes: (recipes as any).count ?? 0,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const stats = [
    { icon: MessageSquare, label: isAr ? "منشوراتي" : "My Posts", value: data?.posts ?? 0, color: "text-primary" },
    { icon: Heart, label: isAr ? "إعجاباتي" : "My Likes", value: data?.likes ?? 0, color: "text-chart-4" },
    { icon: Trophy, label: isAr ? "مسابقاتي" : "Competitions", value: data?.competitions ?? 0, color: "text-chart-2" },
    { icon: BookOpen, label: isAr ? "وصفاتي" : "My Recipes", value: data?.recipes ?? 0, color: "text-chart-3" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {isAr ? "ملخص نشاطي" : "My Activity"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-background ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <AnimatedCounter value={s.value} className="text-lg font-bold leading-none" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
