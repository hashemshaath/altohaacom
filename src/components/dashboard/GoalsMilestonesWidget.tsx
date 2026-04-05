import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, BookOpen, Users, Star, CheckCircle2 } from "lucide-react";

interface Milestone {
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  current: number;
  target: number;
  color: string;
}

export const GoalsMilestonesWidget = memo(function GoalsMilestonesWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: milestones } = useQuery({
    queryKey: ["goals-milestones", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [comps, posts, followers, badges] = await Promise.all([
        supabase.from("competition_registrations").select("id", { count: "exact", head: true }).eq("participant_id", user.id),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      return {
        competitions: comps.count || 0,
        posts: posts.count || 0,
        followers: followers.count || 0,
        badges: badges.count || 0,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (!milestones) return null;

  const getNextTarget = (current: number, targets: number[]) =>
    targets.find((t) => t > current) || targets[targets.length - 1];

  const items: Milestone[] = [
    {
      icon: Trophy,
      labelEn: "Competitions",
      labelAr: "مسابقات",
      current: milestones.competitions,
      target: getNextTarget(milestones.competitions, [5, 10, 25, 50, 100]),
      color: "text-primary",
    },
    {
      icon: BookOpen,
      labelEn: "Posts",
      labelAr: "منشورات",
      current: milestones.posts,
      target: getNextTarget(milestones.posts, [10, 25, 50, 100, 250]),
      color: "text-chart-2",
    },
    {
      icon: Users,
      labelEn: "Followers",
      labelAr: "متابعين",
      current: milestones.followers,
      target: getNextTarget(milestones.followers, [10, 50, 100, 500, 1000]),
      color: "text-chart-3",
    },
    {
      icon: Star,
      labelEn: "Badges",
      labelAr: "شارات",
      current: milestones.badges,
      target: getNextTarget(milestones.badges, [3, 5, 10, 20, 50]),
      color: "text-chart-4",
    },
  ];

  return (
    <Card className="border-border/40 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
            <Target className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "أهدافك" : "Your Goals"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((m) => {
          const pct = Math.min(100, Math.round((m.current / m.target) * 100));
          const done = m.current >= m.target;
          const Icon = m.icon;

          return (
            <div key={m.labelEn} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                  ) : (
                    <Icon className={`h-3.5 w-3.5 ${m.color} transition-transform group-hover:scale-110`} />
                  )}
                  <span className="font-medium">{isAr ? m.labelAr : m.labelEn}</span>
                </div>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 tabular-nums">
                  {m.current}/{m.target}
                </Badge>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});
