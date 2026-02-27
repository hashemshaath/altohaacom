import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, ChefHat } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export function FanSuggestedFollowsWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const { data: suggestions = [] } = useQuery({
    queryKey: ["fan-suggested-follows", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: following } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followedIds = new Set(following?.map((f) => f.following_id) || []);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username, account_type, specialization")
        .eq("account_type", "professional")
        .neq("user_id", user.id)
        .order("view_count", { ascending: false })
        .limit(20);

      return (profiles || [])
        .filter((p) => !followedIds.has(p.user_id))
        .slice(0, 5);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    setFollowingIds((prev) => new Set(prev).add(targetId));
    await supabase.from("user_follows").insert({ follower_id: user.id, following_id: targetId });
  };

  if (suggestions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-chart-2" />
          {isAr ? "طهاة مقترحون" : "Suggested Chefs"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((chef) => (
          <div key={chef.user_id} className="flex items-center gap-3">
            <Link to={`/${chef.username || chef.user_id}`} className="shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={chef.avatar_url || undefined} />
                <AvatarFallback>{(chef.full_name || "C")[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/${chef.username || chef.user_id}`} className="hover:underline">
                <p className="text-sm font-medium truncate">{chef.full_name || chef.username}</p>
              </Link>
              {chef.specialization && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <ChefHat className="h-3 w-3" /> {chef.specialization}
                </p>
              )}
            </div>
            <Button
              variant={followingIds.has(chef.user_id) ? "secondary" : "outline"}
              size="sm"
              className="shrink-0 gap-1"
              disabled={followingIds.has(chef.user_id)}
              onClick={() => handleFollow(chef.user_id)}
            >
              <UserPlus className="h-3 w-3" />
              {followingIds.has(chef.user_id)
                ? (isAr ? "تمت" : "Followed")
                : (isAr ? "تابع" : "Follow")}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
