import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Crown, Shield, MapPin, Star, Users, ArrowRight, BadgeCheck, Briefcase } from "lucide-react";
import { MembershipBadge } from "@/components/membership/MembershipBadge";

export const ProfileSummaryCard = memo(function ProfileSummaryCard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data: profile } = useQuery({
    queryKey: ["profile-summary-card", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, full_name_ar, username, avatar_url, account_type, membership_tier, is_verified, country_code, city, specialization, specialization_ar, loyalty_points")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ["profile-summary-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const followersQ: any = await supabase.from("follows" as any).select("*", { count: "exact", head: true }).eq("following_id", user.id);
      const followingQ: any = await supabase.from("follows" as any).select("*", { count: "exact", head: true }).eq("follower_id", user.id);
      const postsQ: any = await supabase.from("posts" as any).select("*", { count: "exact", head: true }).eq("author_id", user.id);
      return {
        followers: followersQ.count || 0,
        following: followingQ.count || 0,
        posts: postsQ.count || 0,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (!profile) return null;

  const name = isAr && profile.full_name_ar ? profile.full_name_ar : profile.full_name;
  const spec = isAr && profile.specialization_ar ? profile.specialization_ar : profile.specialization;
  const initials = (profile.full_name || "U").slice(0, 2).toUpperCase();

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-lg transition-shadow duration-300">
      {/* Gradient header */}
      <div className="h-20 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.15),transparent_60%)]" />
      </div>
      <CardContent className="relative -mt-10 px-4 pb-4">
        <div className="flex items-end gap-3 mb-3">
          <Avatar className="h-16 w-16 border-4 border-background shadow-xl ring-2 ring-primary/10">
            <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold truncate">{name || profile.username}</h3>
              {profile.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
            </div>
            {profile.username && (
              <p className="text-[10px] text-muted-foreground">@{profile.username}</p>
            )}
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <MembershipBadge tier={profile.membership_tier} isAr={isAr} size="sm" />
          <Badge variant="outline" className="text-[9px] gap-1 px-1.5 py-0.5">
            {profile.account_type === "professional" ? <Briefcase className="h-2.5 w-2.5" /> : <Users className="h-2.5 w-2.5" />}
            {profile.account_type === "professional" ? (isAr ? "محترف" : "Pro") : (isAr ? "متابع" : "Fan")}
          </Badge>
          {spec && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 truncate max-w-[120px]">
              {spec}
            </Badge>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: isAr ? "متابعون" : "Followers", value: stats.followers },
              { label: isAr ? "متابَعون" : "Following", value: stats.following },
              { label: isAr ? "منشورات" : "Posts", value: stats.posts },
            ].map((s, i) => (
              <div key={i} className="text-center bg-muted/40 rounded-xl py-2 border border-border/30 hover:bg-muted/60 transition-colors">
                <div className="text-sm font-bold tabular-nums">{s.value}</div>
                <div className="text-[8px] text-muted-foreground uppercase font-semibold tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Points */}
        {(profile.loyalty_points || 0) > 0 && (
          <div className="flex items-center gap-2 bg-chart-4/10 rounded-xl px-3 py-2 mb-3">
            <Star className="h-3.5 w-3.5 text-chart-4" />
            <span className="text-xs font-bold">{profile.loyalty_points}</span>
            <span className="text-[10px] text-muted-foreground">{isAr ? "نقاط" : "Points"}</span>
          </div>
        )}

        <Link to="/profile">
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8">
            {isAr ? "عرض الملف" : "View Profile"}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
});
