import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { FanShareButton } from "./FanShareButton";

export function FanFollowingTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: followingChefs = [] } = useQuery({
    queryKey: ["fan-following-chefs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id, created_at")
        .eq("follower_id", user.id)
        .order("created_at", { ascending: false });

      if (!follows || follows.length === 0) return [];

      const ids = follows.map((f) => f.following_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username, specialization, account_type")
        .in("user_id", ids);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      return follows.map((f) => ({
        ...profileMap.get(f.following_id),
        followed_at: f.created_at,
      })).filter((f) => f.user_id);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (followingChefs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium">{isAr ? "لم تتابع أحداً بعد" : "Not following anyone yet"}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? "تصفح المجتمع واتبع طهاتك المفضلين" : "Browse the community and follow your favorite chefs"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-chart-2" />
          {isAr ? "المتابَعون" : "Following"} ({followingChefs.length})
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {followingChefs.map((chef: any) => (
          <Card key={chef.user_id} className="transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <Link to={`/${chef.username || chef.user_id}`}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chef.avatar_url || undefined} />
                  <AvatarFallback>{(chef.full_name || "U")[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/${chef.username || chef.user_id}`} className="hover:underline">
                  <p className="font-medium text-sm truncate">{chef.full_name || chef.username}</p>
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  {chef.specialization && (
                    <Badge variant="secondary" className="text-[10px]">{chef.specialization}</Badge>
                  )}
                  {chef.account_type === "professional" && (
                    <Badge variant="outline" className="text-[10px]">{isAr ? "محترف" : "Pro"}</Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  {formatDistanceToNow(new Date(chef.followed_at), {
                    addSuffix: true,
                    locale: isAr ? ar : enUS,
                  })}
                </p>
                </div>
                <FanShareButton
                  title={chef.full_name || "Chef"}
                  url={`${window.location.origin}/${chef.username || chef.user_id}`}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground shrink-0"
                />
              </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
