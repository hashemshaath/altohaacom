import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Link } from "react-router-dom";
import { Mail, MapPin, Shield, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface AdminQuickUserCardProps {
  userId: string;
  children: React.ReactNode;
}

export function AdminQuickUserCard({ userId, children }: AdminQuickUserCardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: profile } = useQuery({
    queryKey: ["quick-user-card", userId],
    queryFn: async () => {
      const [profileRes, rolesRes, statsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, username, avatar_url, email, country_code, city, account_status, account_type, membership_tier, is_verified, created_at").eq("user_id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", userId),
      ]);
      return {
        ...profileRes.data,
        roles: rolesRes.data?.map(r => r.role) || [],
        postsCount: statsRes.count || 0,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  if (!profile) return <>{children}</>;

  const statusColor = {
    active: "bg-chart-2/15 text-chart-2",
    suspended: "bg-destructive/15 text-destructive",
    banned: "bg-destructive/15 text-destructive",
    pending: "bg-chart-4/15 text-chart-4",
  }[profile.account_status || "active"] || "bg-muted text-muted-foreground";

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-72 p-3" align="start">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="text-xs">{(profile.full_name || "U")[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{profile.full_name || "—"}</p>
              {profile.is_verified && <Shield className="h-3 w-3 text-primary shrink-0" />}
            </div>
            {profile.username && (
              <p className="text-xs text-muted-foreground">@{profile.username}</p>
            )}
            <div className="flex flex-wrap gap-1">
              <Badge className={`${statusColor} text-[9px] h-4 px-1.5 border-0`}>
                {profile.account_status}
              </Badge>
              {profile.membership_tier && profile.membership_tier !== "basic" && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                  {profile.membership_tier}
                </Badge>
              )}
              {profile.roles.map((role: string) => (
                <Badge key={role} variant="secondary" className="text-[9px] h-4 px-1.5">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2.5 space-y-1 text-[11px] text-muted-foreground">
          {profile.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 shrink-0" /> {profile.email}
            </div>
          )}
          {(profile.city || profile.country_code) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" /> {[profile.city, profile.country_code].filter(Boolean).join(", ")}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            {isAr ? "انضم" : "Joined"} {format(new Date(profile.created_at), "MMM d, yyyy")}
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-md bg-muted/50 p-1.5">
            <p className="text-sm font-bold">{profile.postsCount}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "منشورات" : "Posts"}</p>
          </div>
          <Button variant="outline" size="sm" className="h-full text-xs" asChild>
            <Link to={`/admin/users?edit=${userId}`}>
              <ExternalLink className="h-3 w-3 me-1" />
              {isAr ? "عرض" : "View"}
            </Link>
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
