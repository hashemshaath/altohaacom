import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { CACHE } from "@/lib/queryConfig";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Star, Users, ArrowRight, BadgeCheck, Briefcase, Trophy, ChefHat, Award, TrendingUp } from "lucide-react";
import { MembershipBadge } from "@/components/membership/MembershipBadge";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const ProfileSummaryCard = memo(function ProfileSummaryCard() {
  const { user } = useAuth();
  const isAr = useIsAr();

  const { data: profile } = useQuery({
    queryKey: ["profile-summary-card", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, full_name_ar, username, avatar_url, account_type, membership_tier, is_verified, country_code, city, specialization, specialization_ar, loyalty_points, years_of_experience, job_title, job_title_ar")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    ...CACHE.medium,
  });

  const { data: stats } = useQuery({
    queryKey: ["profile-summary-stats-v2", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [followersQ, postsQ, recipesQ, certsQ, compsQ, badgesQ] = await Promise.allSettled([
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("recipes").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("certificates").select("id", { count: "exact", head: true }).eq("recipient_id", user.id),
        supabase.from("competition_registrations").select("id", { count: "exact", head: true }).eq("participant_id", user.id),
        supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      const gc = (r: PromiseSettledResult<{ count: number | null }>) => r.status === "fulfilled" ? (r.value.count || 0) : 0;
      return {
        followers: gc(followersQ),
        posts: gc(postsQ),
        recipes: gc(recipesQ),
        certificates: gc(certsQ),
        competitions: gc(compsQ),
        badges: gc(badgesQ),
      };
    },
    enabled: !!user,
    ...CACHE.medium,
  });

  if (!profile) return null;

  const name = isAr && profile.full_name_ar ? profile.full_name_ar : profile.full_name;
  const spec = isAr && profile.specialization_ar ? profile.specialization_ar : profile.specialization;
  const jobTitle = isAr && (profile as any).job_title_ar ? (profile as any).job_title_ar : (profile as any).job_title;
  const initials = (profile.full_name || "U").slice(0, 2).toUpperCase();
  const isPro = profile.account_type === "professional";

  const primaryStats = [
    { label: isAr ? "متابعون" : "Followers", value: stats?.followers || 0, icon: Users },
    { label: isAr ? "منشورات" : "Posts", value: stats?.posts || 0, icon: TrendingUp },
    { label: isAr ? "وصفات" : "Recipes", value: stats?.recipes || 0, icon: ChefHat },
  ];

  const careerStats = isPro ? [
    { label: isAr ? "مسابقات" : "Competitions", value: stats?.competitions || 0, icon: Trophy, color: "text-primary" },
    { label: isAr ? "شهادات" : "Certificates", value: stats?.certificates || 0, icon: Award, color: "text-chart-3" },
    { label: isAr ? "شارات" : "Badges", value: stats?.badges || 0, icon: Star, color: "text-chart-4" },
  ] : [];

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-xl transition-all duration-500 group/card">
      {/* Gradient header */}
      <div className="h-24 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all duration-700 group-hover/card:scale-150" />
        {/* Online indicator */}
        <div className="absolute top-3 end-3 flex items-center gap-1.5 bg-background/70 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-3 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-3" />
          </span>
          <span className="text-[10px] font-semibold text-chart-3">{isAr ? "متصل" : "Online"}</span>
        </div>
      </div>

      <CardContent className="relative -mt-12 px-4 pb-4">
        {/* Avatar + Name */}
        <div className="flex items-end gap-3 mb-3">
          <Avatar className="h-[72px] w-[72px] border-4 border-background shadow-xl ring-2 ring-primary/10">
            <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold truncate">{name || profile.username}</h3>
              {profile.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
            </div>
            {jobTitle && <p className="text-[11px] text-muted-foreground truncate">{jobTitle}</p>}
            {profile.username && <p className="text-[11px] text-muted-foreground/70">@{profile.username}</p>}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <MembershipBadge tier={profile.membership_tier} isAr={isAr} size="sm" />
          <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0.5">
            {isPro ? <Briefcase className="h-2.5 w-2.5" /> : <Users className="h-2.5 w-2.5" />}
            {isPro ? (isAr ? "محترف" : "Pro") : (isAr ? "عادي" : "Regular")}
          </Badge>
          {spec && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 truncate max-w-[120px]">
              {spec}
            </Badge>
          )}
          {profile.city && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-0.5">
              <MapPin className="h-2 w-2" />{profile.city}
            </Badge>
          )}
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {primaryStats.map((s) => (
            <div key={s.label} className="text-center bg-muted/40 rounded-xl py-2 border border-border/30 hover:bg-muted/60 hover:border-primary/20 transition-all duration-300 cursor-default group/stat">
              <div className="text-sm font-bold tabular-nums group-hover/stat:text-primary transition-colors">
                <AnimatedCounter value={s.value} />
              </div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Career Stats for Pros */}
        {isPro && careerStats.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {careerStats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col items-center gap-0.5 bg-muted/20 rounded-xl py-2 border border-border/20 hover:bg-muted/40 transition-all">
                  <Icon className={`h-3 w-3 ${s.color}`} />
                  <span className="text-xs font-bold tabular-nums">{s.value}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Experience + Points */}
        <div className="flex items-center gap-2 mb-3">
          {(profile as any).years_of_experience > 0 && (
            <div className="flex-1 flex items-center gap-1.5 bg-accent/10 rounded-xl px-2.5 py-1.5 border border-accent/15">
              <ChefHat className="h-3 w-3 text-accent-foreground/70" />
              <span className="text-[10px] font-bold">{(profile as any).years_of_experience} {isAr ? "سنة خبرة" : "yrs exp"}</span>
            </div>
          )}
          {(profile.loyalty_points || 0) > 0 && (
            <div className="flex-1 flex items-center gap-1.5 bg-chart-4/10 rounded-xl px-2.5 py-1.5 border border-chart-4/15">
              <Star className="h-3 w-3 text-chart-4" />
              <span className="text-[10px] font-bold"><AnimatedCounter value={profile.loyalty_points || 0} /> {isAr ? "نقطة" : "pts"}</span>
            </div>
          )}
        </div>

        <Link to="/profile">
          <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 rounded-xl text-xs transition-all active:scale-95">
            {isAr ? "عرض الملف" : "View Profile"}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
});
